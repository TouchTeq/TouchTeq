-- Migration: Atomic status transition functions for all document types
-- Date: 2026-03-31
--
-- Each function validates the transition, applies it atomically, and returns
-- the previous and new status. Invalid transitions raise an exception.

-- ============================================================
-- INVOICE STATUS TRANSITION
-- ============================================================
create or replace function public.transition_invoice_status(
  p_invoice_id uuid,
  p_action   text,
  p_new_status text
)
returns jsonb
language plpgsql
as $$
declare
  v_current_status text;
  v_amount_paid    numeric;
  v_doc            record;
  v_result         jsonb;
begin
  select status, amount_paid into v_current_status, v_amount_paid
  from public.invoices where id = p_invoice_id;

  if v_current_status is null then
    raise exception 'Invoice not found';
  end if;

  -- Validate transitions
  case v_current_status
    when 'Draft' then
      if p_action not in ('mark_sent', 'cancel') then
        raise exception 'Action "%" not allowed from Draft. Allowed: mark_sent, cancel', p_action;
      end if;
    when 'Sent' then
      if p_action not in ('mark_partially_paid', 'mark_paid', 'mark_overdue', 'cancel', 'mark_draft') then
        raise exception 'Action "%" not allowed from Sent. Allowed: mark_partially_paid, mark_paid, mark_overdue, cancel, mark_draft', p_action;
      end if;
    when 'Partially Paid' then
      if p_action not in ('mark_paid', 'mark_overdue') then
        raise exception 'Action "%" not allowed from Partially Paid. Allowed: mark_paid, mark_overdue', p_action;
      end if;
    when 'Overdue' then
      if p_action not in ('mark_partially_paid', 'mark_paid', 'cancel', 'mark_sent') then
        raise exception 'Action "%" not allowed from Overdue. Allowed: mark_partially_paid, mark_paid, cancel, mark_sent', p_action;
      end if;
    when 'Cancelled' then
      if p_action != 'reopen' then
        raise exception 'Action "%" not allowed from Cancelled. Allowed: reopen', p_action;
      end if;
      if v_amount_paid > 0 then
        raise exception 'Cannot reopen an invoice that has payments recorded. Reverse payments first.';
      end if;
    when 'Credit Note' then
      if p_action != 'reopen' then
        raise exception 'Action "%" not allowed from Credit Note. Allowed: reopen', p_action;
      end if;
    when 'Paid' then
      raise exception 'Paid invoices cannot change status (finance integrity).';
    else
      raise exception 'Unknown invoice status: %', v_current_status;
  end case;

  update public.invoices
  set status = p_new_status, updated_at = now()
  where id = p_invoice_id;

  return jsonb_build_object(
    'success', true,
    'previous_status', v_current_status,
    'new_status', p_new_status,
    'action', p_action
  );
end;
$$;

-- ============================================================
-- QUOTE STATUS TRANSITION
-- ============================================================
create or replace function public.transition_quote_status(
  p_quote_id   uuid,
  p_action     text,
  p_new_status text
)
returns jsonb
language plpgsql
as $$
declare
  v_current_status      text;
  v_converted_invoice_id uuid;
begin
  select status, converted_invoice_id into v_current_status, v_converted_invoice_id
  from public.quotes where id = p_quote_id;

  if v_current_status is null then
    raise exception 'Quote not found';
  end if;

  case v_current_status
    when 'Draft' then
      if p_action not in ('mark_sent', 'accept') then
        raise exception 'Action "%" not allowed from Draft. Allowed: mark_sent, accept', p_action;
      end if;
    when 'Sent' then
      if p_action not in ('accept', 'decline', 'reject', 'expire', 'convert', 'mark_draft') then
        raise exception 'Action "%" not allowed from Sent. Allowed: accept, decline, reject, expire, convert, mark_draft', p_action;
      end if;
    when 'Accepted' then
      if p_action != 'convert' then
        raise exception 'Action "%" not allowed from Accepted. Allowed: convert', p_action;
      end if;
    when 'Declined' then
      if p_action != 'reopen' then
        raise exception 'Action "%" not allowed from Declined. Allowed: reopen', p_action;
      end if;
    when 'Rejected' then
      if p_action != 'reopen' then
        raise exception 'Action "%" not allowed from Rejected. Allowed: reopen', p_action;
      end if;
    when 'Expired' then
      if p_action != 'reopen' then
        raise exception 'Action "%" not allowed from Expired. Allowed: reopen', p_action;
      end if;
    when 'Converted' then
      if p_action != 'reopen' then
        raise exception 'Action "%" not allowed from Converted. Allowed: reopen', p_action;
      end if;
      if v_converted_invoice_id is not null then
        raise exception 'Cannot revert — an invoice has already been created from this quote.';
      end if;
    else
      raise exception 'Unknown quote status: %', v_current_status;
  end case;

  update public.quotes
  set status = p_new_status, updated_at = now()
  where id = p_quote_id;

  return jsonb_build_object(
    'success', true,
    'previous_status', v_current_status,
    'new_status', p_new_status,
    'action', p_action
  );
end;
$$;

-- ============================================================
-- PURCHASE ORDER STATUS TRANSITION
-- ============================================================
create or replace function public.transition_po_status(
  p_po_id      uuid,
  p_action     text,
  p_new_status text
)
returns jsonb
language plpgsql
as $$
declare
  v_current_status text;
begin
  select status into v_current_status
  from public.purchase_orders where id = p_po_id;

  if v_current_status is null then
    raise exception 'Purchase order not found';
  end if;

  case v_current_status
    when 'Draft' then
      if p_action not in ('mark_sent', 'cancel') then
        raise exception 'Action "%" not allowed from Draft. Allowed: mark_sent, cancel', p_action;
      end if;
    when 'Sent' then
      if p_action not in ('acknowledge', 'cancel') then
        raise exception 'Action "%" not allowed from Sent. Allowed: acknowledge, cancel', p_action;
      end if;
    when 'Acknowledged' then
      if p_action not in ('mark_delivered', 'cancel') then
        raise exception 'Action "%" not allowed from Acknowledged. Allowed: mark_delivered, cancel', p_action;
      end if;
    when 'Delivered' then
      if p_action != 'cancel' then
        raise exception 'Action "%" not allowed from Delivered. Allowed: cancel', p_action;
      end if;
    when 'Cancelled' then
      if p_action != 'reopen' then
        raise exception 'Action "%" not allowed from Cancelled. Allowed: reopen', p_action;
      end if;
    else
      raise exception 'Unknown PO status: %', v_current_status;
  end case;

  update public.purchase_orders
  set status = p_new_status, updated_at = now()
  where id = p_po_id;

  return jsonb_build_object(
    'success', true,
    'previous_status', v_current_status,
    'new_status', p_new_status,
    'action', p_action
  );
end;
$$;

-- ============================================================
-- CREDIT NOTE STATUS TRANSITION
-- ============================================================
create or replace function public.transition_cn_status(
  p_cn_id      uuid,
  p_action     text,
  p_new_status text
)
returns jsonb
language plpgsql
as $$
declare
  v_current_status     text;
  v_applied_invoice_id uuid;
  v_applied_amount     numeric;
begin
  select status, applied_invoice_id, coalesce(applied_amount, 0)
  into v_current_status, v_applied_invoice_id, v_applied_amount
  from public.credit_notes where id = p_cn_id;

  if v_current_status is null then
    raise exception 'Credit note not found';
  end if;

  case v_current_status
    when 'Draft' then
      if p_action not in ('issue', 'mark_sent', 'cancel') then
        raise exception 'Action "%" not allowed from Draft. Allowed: issue, mark_sent, cancel', p_action;
      end if;
    when 'Sent' then
      if p_action not in ('issue', 'cancel') then
        raise exception 'Action "%" not allowed from Sent. Allowed: issue, cancel', p_action;
      end if;
    when 'Issued' then
      if p_action not in ('apply', 'cancel') then
        raise exception 'Action "%" not allowed from Issued. Allowed: apply, cancel', p_action;
      end if;
      if p_action = 'cancel' and (v_applied_invoice_id is not null or v_applied_amount > 0) then
        raise exception 'Cannot cancel a credit note that has been applied to an invoice.';
      end if;
    when 'Applied' then
      raise exception 'Applied credit notes cannot change status.';
    when 'Cancelled' then
      if p_action != 'reopen' then
        raise exception 'Action "%" not allowed from Cancelled. Allowed: reopen', p_action;
      end if;
    else
      raise exception 'Unknown credit note status: %', v_current_status;
  end case;

  update public.credit_notes
  set status = p_new_status, updated_at = now()
  where id = p_cn_id;

  return jsonb_build_object(
    'success', true,
    'previous_status', v_current_status,
    'new_status', p_new_status,
    'action', p_action
  );
end;
$$;
