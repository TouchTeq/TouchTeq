-- Migration: Finance integrity functions
-- Date: 2026-03-31
--
-- Atomic payment recording and credit note application with balance
-- recalculation, status updates, and guard rails for cancelled/paid invoices.

-- ============================================================
-- RECORD PAYMENT — atomic payment + balance + status update
-- ============================================================
create or replace function public.record_invoice_payment(
  p_invoice_id      uuid,
  p_amount          numeric,
  p_payment_date    date    default null,
  p_payment_method  text    default 'EFT',
  p_reference       text    default null,
  p_notes           text    default null
)
returns jsonb
language plpgsql
as $$
declare
  v_invoice_total   numeric;
  v_amount_paid     numeric;
  v_balance_due     numeric;
  v_current_status  text;
  v_new_status      text;
  v_new_paid        numeric;
  v_new_balance     numeric;
  v_payment_id      uuid;
  v_invoice_number  text;
begin
  -- Lock the invoice row to prevent concurrent payment races
  select total, amount_paid, balance_due, status, invoice_number
  into v_invoice_total, v_amount_paid, v_balance_due, v_current_status, v_invoice_number
  from public.invoices
  where id = p_invoice_id
  for update;

  if v_invoice_number is null then
    raise exception 'Invoice not found';
  end if;

  -- Guard: reject payments on cancelled invoices
  if v_current_status = 'Cancelled' then
    raise exception 'Cannot record payment on a cancelled invoice (%%). Issue a credit note instead.', v_invoice_number;
  end if;

  -- Guard: reject payments on already fully paid invoices
  if v_current_status = 'Paid' then
    raise exception 'Invoice %% is already fully paid (R%%).', v_invoice_number, v_invoice_total;
  end if;

  -- Guard: reject negative or zero amounts
  if p_amount <= 0 then
    raise exception 'Payment amount must be positive.';
  end if;

  -- Guard: prevent overpayment (payment > remaining balance)
  if p_amount > v_balance_due then
    raise exception 'Payment amount (R%%) exceeds remaining balance (R%%) on invoice %%.', p_amount, v_balance_due, v_invoice_number;
  end if;

  -- Insert payment row
  insert into public.payments (
    invoice_id, payment_date, amount, payment_method, reference, notes
  )
  values (
    p_invoice_id,
    coalesce(p_payment_date, current_date),
    p_amount,
    p_payment_method,
    p_reference,
    p_notes
  )
  returning id into v_payment_id;

  -- Recalculate
  v_new_paid := v_amount_paid + p_amount;
  v_new_balance := v_invoice_total - v_new_paid;

  -- Ensure balance_due doesn't go negative due to rounding
  if v_new_balance < 0 then
    v_new_paid := v_invoice_total;
    v_new_balance := 0;
  end if;

  -- Determine new status
  if v_new_balance <= 0 then
    v_new_status := 'Paid';
  elsif v_new_paid > 0 then
    v_new_status := 'Partially Paid';
  else
    v_new_status := v_current_status;
  end if;

  -- Update invoice
  update public.invoices
  set amount_paid = v_new_paid,
      balance_due = v_new_balance,
      status = v_new_status,
      updated_at = now()
  where id = p_invoice_id;

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'invoice_number', v_invoice_number,
    'previous_status', v_current_status,
    'new_status', v_new_status,
    'amount_paid', v_new_paid,
    'balance_due', v_new_balance,
    'invoice_total', v_invoice_total
  );
end;
$$;

-- ============================================================
-- APPLY CREDIT NOTE — atomic credit note application + invoice update
-- ============================================================
create or replace function public.apply_credit_note_to_invoice(
  p_credit_note_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_cn_status       text;
  v_cn_total        numeric;
  v_cn_invoice_id   uuid;
  v_cn_number       text;
  v_cn_client_id    uuid;
  v_invoice_total   numeric;
  v_invoice_paid    numeric;
  v_invoice_balance numeric;
  v_invoice_status  text;
  v_invoice_number  text;
  v_new_balance     numeric;
  v_new_status      text;
  v_already_applied boolean;
begin
  -- Lock the credit note row
  select status, total, invoice_id, cn_number, client_id
  into v_cn_status, v_cn_total, v_cn_invoice_id, v_cn_number, v_cn_client_id
  from public.credit_notes
  where id = p_credit_note_id
  for update;

  if v_cn_number is null then
    raise exception 'Credit note not found';
  end if;

  -- Guard: must be in Issued status to apply
  if v_cn_status != 'Issued' then
    raise exception 'Credit note %% is in status "%%" and cannot be applied. Only Issued credit notes can be applied.', v_cn_number, v_cn_status;
  end if;

  -- Guard: must be linked to an invoice
  if v_cn_invoice_id is null then
    raise exception 'Credit note %% is not linked to any invoice. Link it first.', v_cn_number;
  end if;

  -- Lock the invoice row
  select total, amount_paid, balance_due, status, invoice_number
  into v_invoice_total, v_invoice_paid, v_invoice_balance, v_invoice_status, v_invoice_number
  from public.invoices
  where id = v_cn_invoice_id
  for update;

  if v_invoice_number is null then
    raise exception 'Linked invoice not found';
  end if;

  -- Guard: cannot apply to cancelled invoice
  if v_invoice_status = 'Cancelled' then
    raise exception 'Cannot apply credit note %% to a cancelled invoice (%%).', v_cn_number, v_invoice_number;
  end if;

  -- Guard: cannot apply to already fully paid invoice
  if v_invoice_status = 'Paid' then
    raise exception 'Invoice %% is already fully paid. Credit note %% cannot be applied.', v_invoice_number, v_cn_number;
  end if;

  -- Guard: check if credit note already applied (double-application prevention)
  select exists (
    select 1 from public.credit_note_applications
    where credit_note_id = p_credit_note_id
  ) into v_already_applied;

  if v_already_applied then
    raise exception 'Credit note %% has already been applied.', v_cn_number;
  end if;

  -- Record the application
  insert into public.credit_note_applications (
    credit_note_id, invoice_id, applied_amount, applied_date
  )
  values (
    p_credit_note_id, v_cn_invoice_id, v_cn_total, current_date
  );

  -- Recalculate invoice balance
  v_new_balance := v_invoice_balance - v_cn_total;

  -- Don't let balance go negative
  if v_new_balance < 0 then
    v_new_balance := 0;
  end if;

  -- Determine new status
  if v_new_balance <= 0 then
    v_new_status := 'Paid';
  elsif v_new_balance < v_invoice_total then
    v_new_status := 'Partially Paid';
  else
    v_new_status := v_invoice_status;
  end if;

  -- Update invoice
  update public.invoices
  set balance_due = v_new_balance,
      status = v_new_status,
      updated_at = now()
  where id = v_cn_invoice_id;

  -- Update credit note status
  update public.credit_notes
  set status = 'Applied',
      applied_invoice_id = v_cn_invoice_id,
      applied_amount = v_cn_total,
      applied_date = current_date,
      updated_at = now()
  where id = p_credit_note_id;

  return jsonb_build_object(
    'success', true,
    'credit_note_number', v_cn_number,
    'invoice_number', v_invoice_number,
    'credit_note_amount', v_cn_total,
    'previous_invoice_balance', v_invoice_balance,
    'new_invoice_balance', v_new_balance,
    'previous_invoice_status', v_invoice_status,
    'new_invoice_status', v_new_status
  );
end;
$$;

-- ============================================================
-- CREDIT NOTE APPLICATIONS TABLE
-- ============================================================
-- Provides an auditable ledger of credit note applications.
-- Each credit note can only appear once (enforced by unique constraint).
-- ============================================================

create table if not exists public.credit_note_applications (
  id              uuid primary key default gen_random_uuid(),
  credit_note_id  uuid not null references public.credit_notes (id) on delete cascade,
  invoice_id      uuid not null references public.invoices (id) on delete cascade,
  applied_amount  numeric(15,2) not null,
  applied_date    date not null default current_date,
  created_at      timestamptz not null default now(),
  unique (credit_note_id)
);

create index if not exists credit_note_applications_invoice_id_idx
  on public.credit_note_applications (invoice_id);

comment on table public.credit_note_applications is
  'Auditable ledger of credit note applications. Each credit note can only be applied once.';

-- ============================================================
-- ADD missing columns to credit_notes if they don't exist
-- ============================================================

alter table public.credit_notes
  add column if not exists applied_invoice_id uuid references public.invoices (id) on delete set null;

alter table public.credit_notes
  add column if not exists applied_amount numeric(15,2) default 0;

alter table public.credit_notes
  add column if not exists applied_date date;
