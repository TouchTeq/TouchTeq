-- Migration: Finance Hardening — Fix schema mismatches and add integrity constraints
-- Date: 2026-03-31
--
-- Fixes:
-- 1. Credit note status constraint to include Issued and Cancelled
-- 2. Add cn_number alias for backward compatibility
-- 3. Add constraint to prevent balance_due inconsistencies
-- 4. Add audit trail for manual status changes

-- ============================================================
-- FIX 1: Update credit_notes status constraint
-- ============================================================
-- Drop old constraint and add new one with all required statuses
ALTER TABLE public.credit_notes 
  DROP CONSTRAINT IF EXISTS credit_notes_status_check;

ALTER TABLE public.credit_notes
  ADD CONSTRAINT credit_notes_status_check 
  CHECK (status IN ('Draft', 'Sent', 'Issued', 'Applied', 'Cancelled'));

-- ============================================================
-- FIX 2: Add cn_number column as alias for credit_note_number
-- ============================================================
-- The finance_integrity functions reference cn_number, but the original
-- table uses credit_note_number. Add cn_number as a generated column.
ALTER TABLE public.credit_notes
  ADD COLUMN IF NOT EXISTS cn_number TEXT;

-- Backfill cn_number from credit_note_number
UPDATE public.credit_notes 
SET cn_number = credit_note_number 
WHERE cn_number IS NULL;

-- Make cn_number NOT NULL after backfill
ALTER TABLE public.credit_notes
  ALTER COLUMN cn_number SET NOT NULL;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'credit_notes_cn_number_key'
  ) THEN
    ALTER TABLE public.credit_notes
      ADD CONSTRAINT credit_notes_cn_number_key UNIQUE (cn_number);
  END IF;
END $$;

-- ============================================================
-- FIX 3: Add trigger to keep cn_number in sync with credit_note_number
-- ============================================================
CREATE OR REPLACE FUNCTION sync_cn_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cn_number := NEW.credit_note_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_cn_number_trigger ON public.credit_notes;
CREATE TRIGGER sync_cn_number_trigger
  BEFORE INSERT OR UPDATE OF credit_note_number ON public.credit_notes
  FOR EACH ROW
  EXECUTE FUNCTION sync_cn_number();

-- ============================================================
-- FIX 4: Add constraint to ensure balance_due consistency
-- ============================================================
-- balance_due should always equal total - amount_paid
-- This is enforced at the application level via the record_invoice_payment function
-- but we add a CHECK constraint for additional safety

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_balance_consistency;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_balance_consistency
  CHECK (balance_due >= 0 AND balance_due <= total);

-- ============================================================
-- FIX 5: Add constraint to ensure amount_paid consistency
-- ============================================================
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_amount_paid_consistency;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_amount_paid_consistency
  CHECK (amount_paid >= 0 AND amount_paid <= total);

-- ============================================================
-- FIX 6: Create audit log for manual invoice status changes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_status_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_invoice_status_audit_invoice_id 
  ON public.invoice_status_audit(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_status_audit_performed_at 
  ON public.invoice_status_audit(performed_at);

-- ============================================================
-- FIX 7: Create audit log for credit note applications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_note_application_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  applied_amount NUMERIC(15,2) NOT NULL,
  previous_invoice_balance NUMERIC(15,2) NOT NULL,
  new_invoice_balance NUMERIC(15,2) NOT NULL,
  previous_invoice_status TEXT NOT NULL,
  new_invoice_status TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cn_application_audit_credit_note_id 
  ON public.credit_note_application_audit(credit_note_id);

CREATE INDEX IF NOT EXISTS idx_cn_application_audit_invoice_id 
  ON public.credit_note_application_audit(invoice_id);

-- ============================================================
-- FIX 8: Enhanced record_invoice_payment with audit logging
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
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
    raise exception 'Cannot record payment on a cancelled invoice (%). Issue a credit note instead.', v_invoice_number;
  end if;

  -- Guard: reject payments on already fully paid invoices
  if v_current_status = 'Paid' then
    raise exception 'Invoice % is already fully paid (R%).', v_invoice_number, v_invoice_total;
  end if;

  -- Guard: reject negative or zero amounts
  if p_amount <= 0 then
    raise exception 'Payment amount must be positive.';
  end if;

  -- Guard: prevent overpayment (payment > remaining balance)
  if p_amount > v_balance_due then
    raise exception 'Payment amount (R%) exceeds remaining balance (R%) on invoice %.', p_amount, v_balance_due, v_invoice_number;
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

  -- Audit log
  insert into public.invoice_status_audit (
    invoice_id, previous_status, new_status, action, metadata
  ) values (
    p_invoice_id, v_current_status, v_new_status, 'payment_recorded',
    jsonb_build_object(
      'payment_id', v_payment_id,
      'amount', p_amount,
      'payment_method', p_payment_method,
      'reference', p_reference
    )
  );

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
-- FIX 9: Enhanced apply_credit_note_to_invoice with audit logging
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_credit_note_to_invoice(
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
    raise exception 'Credit note % is in status "%" and cannot be applied. Only Issued credit notes can be applied.', v_cn_number, v_cn_status;
  end if;

  -- Guard: must be linked to an invoice
  if v_cn_invoice_id is null then
    raise exception 'Credit note % is not linked to any invoice. Link it first.', v_cn_number;
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
    raise exception 'Cannot apply credit note % to a cancelled invoice (%).', v_cn_number, v_invoice_number;
  end if;

  -- Guard: cannot apply to already fully paid invoice
  if v_invoice_status = 'Paid' then
    raise exception 'Invoice % is already fully paid. Credit note % cannot be applied.', v_invoice_number, v_cn_number;
  end if;

  -- Guard: check if credit note already applied (double-application prevention)
  select exists (
    select 1 from public.credit_note_applications
    where credit_note_id = p_credit_note_id
  ) into v_already_applied;

  if v_already_applied then
    raise exception 'Credit note % has already been applied.', v_cn_number;
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

  -- Audit log for credit note application
  insert into public.credit_note_application_audit (
    credit_note_id, invoice_id, applied_amount,
    previous_invoice_balance, new_invoice_balance,
    previous_invoice_status, new_invoice_status
  ) values (
    p_credit_note_id, v_cn_invoice_id, v_cn_total,
    v_invoice_balance, v_new_balance,
    v_invoice_status, v_new_status
  );

  -- Audit log for invoice status change
  if v_invoice_status != v_new_status then
    insert into public.invoice_status_audit (
      invoice_id, previous_status, new_status, action, metadata
    ) values (
      v_cn_invoice_id, v_invoice_status, v_new_status, 'credit_note_applied',
      jsonb_build_object(
        'credit_note_id', p_credit_note_id,
        'credit_note_number', v_cn_number,
        'applied_amount', v_cn_total
      )
    );
  end if;

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
-- FIX 10: Function to safely void an invoice with payment reversal
-- ============================================================
CREATE OR REPLACE FUNCTION public.void_invoice_with_reversal(
  p_invoice_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_current_status  text;
  v_amount_paid     numeric;
  v_invoice_number  text;
  v_payment_count   integer;
begin
  -- Lock the invoice row
  select status, amount_paid, invoice_number
  into v_current_status, v_amount_paid, v_invoice_number
  from public.invoices
  where id = p_invoice_id
  for update;

  if v_invoice_number is null then
    raise exception 'Invoice not found';
  end if;

  -- Guard: cannot void already cancelled invoice
  if v_current_status = 'Cancelled' then
    raise exception 'Invoice % is already cancelled.', v_invoice_number;
  end if;

  -- Guard: cannot void paid invoices (use credit note instead)
  if v_current_status = 'Paid' then
    raise exception 'Invoice % is fully paid. Issue a credit note instead of voiding.', v_invoice_number;
  end if;

  -- Check if there are payments
  SELECT COUNT(*) INTO v_payment_count
  FROM public.payments
  WHERE invoice_id = p_invoice_id;

  -- Guard: cannot void invoice with payments (must reverse payments first)
  if v_payment_count > 0 then
    raise exception 'Invoice % has % payment(s) recorded. Reverse payments before voiding, or issue a credit note.', v_invoice_number, v_payment_count;
  end if;

  -- Void the invoice
  update public.invoices
  set status = 'Cancelled',
      balance_due = 0,
      updated_at = now()
  where id = p_invoice_id;

  -- Audit log
  insert into public.invoice_status_audit (
    invoice_id, previous_status, new_status, action, metadata
  ) values (
    p_invoice_id, v_current_status, 'Cancelled', 'voided',
    jsonb_build_object('reason', p_reason)
  );

  return jsonb_build_object(
    'success', true,
    'invoice_number', v_invoice_number,
    'previous_status', v_current_status,
    'new_status', 'Cancelled'
  );
end;
$$;

-- ============================================================
-- FIX 11: Function to reverse a payment (for corrections)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reverse_payment(
  p_payment_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_payment         record;
  v_invoice         record;
  v_new_paid        numeric;
  v_new_balance     numeric;
  v_new_status      text;
begin
  -- Lock the payment row
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if v_payment.id is null then
    raise exception 'Payment not found';
  end if;

  -- Lock the invoice row
  select * into v_invoice
  from public.invoices
  where id = v_payment.invoice_id
  for update;

  if v_invoice.id is null then
    raise exception 'Invoice not found for this payment';
  end if;

  -- Guard: cannot reverse payment on cancelled invoice
  if v_invoice.status = 'Cancelled' then
    raise exception 'Cannot reverse payment on a cancelled invoice.';
  end if;

  -- Calculate new values
  v_new_paid := v_invoice.amount_paid - v_payment.amount;
  v_new_balance := v_invoice.balance_due + v_payment.amount;

  -- Ensure values are within bounds
  if v_new_paid < 0 then
    v_new_paid := 0;
  end if;
  if v_new_balance > v_invoice.total then
    v_new_balance := v_invoice.total;
  end if;

  -- Determine new status
  if v_new_paid <= 0 then
    v_new_status := 'Sent';  -- Revert to Sent if no payments remain
  elsif v_new_balance > 0 then
    v_new_status := 'Partially Paid';
  else
    v_new_status := 'Paid';
  end if;

  -- Update invoice
  update public.invoices
  set amount_paid = v_new_paid,
      balance_due = v_new_balance,
      status = v_new_status,
      updated_at = now()
  where id = v_invoice.id;

  -- Mark payment as reversed (soft delete)
  update public.payments
  set notes = COALESCE(notes, '') || ' [REVERSED: ' || COALESCE(p_reason, 'No reason') || ']',
      amount = 0
  where id = p_payment_id;

  -- Audit log
  insert into public.invoice_status_audit (
    invoice_id, previous_status, new_status, action, metadata
  ) values (
    v_invoice.id, v_invoice.status, v_new_status, 'payment_reversed',
    jsonb_build_object(
      'payment_id', p_payment_id,
      'reversed_amount', v_payment.amount,
      'reason', p_reason
    )
  );

  return jsonb_build_object(
    'success', true,
    'invoice_number', v_invoice.invoice_number,
    'reversed_amount', v_payment.amount,
    'new_amount_paid', v_new_paid,
    'new_balance_due', v_new_balance,
    'new_status', v_new_status
  );
end;
$$;

-- ============================================================
-- FIX 12: Function to cancel an applied credit note (reversal)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_applied_credit_note(
  p_credit_note_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_cn              record;
  v_invoice         record;
  v_application     record;
  v_new_balance     numeric;
  v_new_status      text;
begin
  -- Lock the credit note row
  select * into v_cn
  from public.credit_notes
  where id = p_credit_note_id
  for update;

  if v_cn.id is null then
    raise exception 'Credit note not found';
  end if;

  -- Guard: must be in Applied status
  if v_cn.status != 'Applied' then
    raise exception 'Credit note % is not in Applied status. Current status: %', v_cn.cn_number, v_cn.status;
  end if;

  -- Get the application record
  select * into v_application
  from public.credit_note_applications
  where credit_note_id = p_credit_note_id;

  if v_application.id is null then
    raise exception 'No application record found for credit note %', v_cn.cn_number;
  end if;

  -- Lock the invoice row
  select * into v_invoice
  from public.invoices
  where id = v_application.invoice_id
  for update;

  if v_invoice.id is null then
    raise exception 'Linked invoice not found';
  end if;

  -- Calculate new balance
  v_new_balance := v_invoice.balance_due + v_application.applied_amount;

  -- Don't let balance exceed invoice total
  if v_new_balance > v_invoice.total then
    v_new_balance := v_invoice.total;
  end if;

  -- Determine new status
  if v_new_balance >= v_invoice.total then
    v_new_status := 'Sent';  -- Revert to Sent if balance is back to full
  elsif v_new_balance > 0 then
    v_new_status := 'Partially Paid';
  else
    v_new_status := 'Paid';
  end if;

  -- Update invoice
  update public.invoices
  set balance_due = v_new_balance,
      status = v_new_status,
      updated_at = now()
  where id = v_invoice.id;

  -- Update credit note status back to Issued
  update public.credit_notes
  set status = 'Issued',
      applied_invoice_id = null,
      applied_amount = 0,
      applied_date = null,
      updated_at = now()
  where id = p_credit_note_id;

  -- Remove application record
  delete from public.credit_note_applications
  where credit_note_id = p_credit_note_id;

  -- Audit log for credit note cancellation
  insert into public.credit_note_application_audit (
    credit_note_id, invoice_id, applied_amount,
    previous_invoice_balance, new_invoice_balance,
    previous_invoice_status, new_invoice_status
  ) values (
    p_credit_note_id, v_invoice.id, -v_application.applied_amount,
    v_invoice.balance_due, v_new_balance,
    v_invoice.status, v_new_status
  );

  -- Audit log for invoice status change
  if v_invoice.status != v_new_status then
    insert into public.invoice_status_audit (
      invoice_id, previous_status, new_status, action, metadata
    ) values (
      v_invoice.id, v_invoice.status, v_new_status, 'credit_note_cancelled',
      jsonb_build_object(
        'credit_note_id', p_credit_note_id,
        'credit_note_number', v_cn.cn_number,
        'reversed_amount', v_application.applied_amount,
        'reason', p_reason
      )
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'credit_note_number', v_cn.cn_number,
    'invoice_number', v_invoice.invoice_number,
    'reversed_amount', v_application.applied_amount,
    'new_invoice_balance', v_new_balance,
    'new_invoice_status', v_new_status
  );
end;
$$;

-- ============================================================
-- FIX 13: Add RLS policies for audit tables
-- ============================================================
ALTER TABLE public.invoice_status_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_note_application_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice status audit" ON public.invoice_status_audit 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view credit note application audit" ON public.credit_note_application_audit 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- FIX 14: Add helpful views for finance reporting
-- ============================================================
CREATE OR REPLACE VIEW public.invoice_payment_summary AS
SELECT 
  i.id AS invoice_id,
  i.invoice_number,
  i.client_id,
  c.company_name AS client_name,
  i.total AS invoice_total,
  i.amount_paid,
  i.balance_due,
  i.status AS invoice_status,
  i.issue_date,
  i.due_date,
  COUNT(p.id) AS payment_count,
  COALESCE(SUM(p.amount), 0) AS total_payments,
  COUNT(cn.id) AS credit_note_count,
  COALESCE(SUM(cn.applied_amount), 0) AS total_credits
FROM public.invoices i
LEFT JOIN public.clients c ON i.client_id = c.id
LEFT JOIN public.payments p ON i.id = p.invoice_id
LEFT JOIN public.credit_note_applications cna ON i.id = cna.invoice_id
LEFT JOIN public.credit_notes cn ON cna.credit_note_id = cn.id
GROUP BY i.id, i.invoice_number, i.client_id, c.company_name, 
         i.total, i.amount_paid, i.balance_due, i.status, 
         i.issue_date, i.due_date;

-- Grant access to the view
GRANT SELECT ON public.invoice_payment_summary TO authenticated;

-- ============================================================
-- FIX 15: Add helpful indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_credit_notes_status ON public.credit_notes(status);