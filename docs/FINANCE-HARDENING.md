# Finance Workflow Hardening — Implementation Report

**Date:** 2026-03-31  
**Status:** ✅ Complete  
**Migration:** `supabase/migrations/20260331_finance_hardening.sql`

---

## Executive Summary

This hardening addresses accounting integrity risks in the Touch Teq office dashboard by implementing atomic database functions for payment recording, credit note application, and invoice voiding. All finance operations now use row-level locking, proper guards, and auditable ledger tables.

---

## Changes Made

### 1. Schema/Migration Changes (`20260331_finance_hardening.sql`)

#### Credit Note Status Constraint Fix
- **Before:** `CHECK (status IN ('Draft', 'Sent', 'Applied'))`
- **After:** `CHECK (status IN ('Draft', 'Sent', 'Issued', 'Applied', 'Cancelled'))`
- **Reason:** Finance integrity functions require `Issued` and `Cancelled` statuses

#### `cn_number` Column Addition
- Added `cn_number` column to `credit_notes` table
- Backfilled from existing `credit_note_number` column
- Added trigger `sync_cn_number()` to keep columns in sync
- **Reason:** Finance integrity functions reference `cn_number`

#### Balance Consistency Constraints
```sql
-- Ensures balance_due is always between 0 and total
CONSTRAINT invoices_balance_consistency
  CHECK (balance_due >= 0 AND balance_due <= total)

-- Ensures amount_paid is always between 0 and total
CONSTRAINT invoices_amount_paid_consistency
  CHECK (amount_paid >= 0 AND amount_paid <= total)
```

#### Audit Tables Created

**`invoice_status_audit`**
- Tracks all invoice status changes
- Records: previous_status, new_status, action, performed_by, metadata (JSONB)
- Actions: `payment_recorded`, `credit_note_applied`, `credit_note_cancelled`, `voided`, `payment_reversed`

**`credit_note_application_audit`**
- Tracks all credit note applications and reversals
- Records: applied_amount, previous/new invoice balance, previous/new invoice status

#### New Database Functions

| Function | Purpose |
|----------|---------|
| `record_invoice_payment` | Atomic payment recording with guards |
| `apply_credit_note_to_invoice` | Atomic credit note application with double-application prevention |
| `void_invoice_with_reversal` | Safe invoice voiding with payment checks |
| `reverse_payment` | Payment reversal with balance recalculation |
| `cancel_applied_credit_note` | Credit note reversal with invoice balance restoration |

#### Reporting View
```sql
CREATE VIEW invoice_payment_summary AS
-- Joins invoices with payments and credit notes for reporting
```

---

### 2. Application Logic Changes

#### `app/api/chat/route.ts`

**`executeMarkInvoicePaid`**
- **Before:** Direct update `SET status='Paid', amount_paid=total, balance_due=0`
- **After:** Calls `record_invoice_payment` RPC with remaining balance
- **Benefit:** Creates proper payment record and audit trail

**`executeVoidInvoice`**
- **Before:** Direct update `SET status='Cancelled', balance_due=0`
- **After:** Calls `void_invoice_with_reversal` RPC
- **Benefit:** Prevents voiding invoices with payments, proper error messages

#### `lib/office/creditNoteActions.ts`

**New Functions Added:**
- `applyCreditNote(id)` — Uses atomic DB function
- `cancelAppliedCreditNote(id, reason?)` — Reverses applied credit notes
- `reversePayment(paymentId, reason?)` — Reverses payments
- `voidInvoiceWithReversal(invoiceId, reason?)` — Safe invoice voiding

---

## Finance Rules Implemented

### Payment Recording Rules

| Rule | Implementation |
|------|----------------|
| Prevent payments on cancelled invoices | `IF status = 'Cancelled' THEN RAISE EXCEPTION` |
| Prevent payments on fully paid invoices | `IF status = 'Paid' THEN RAISE EXCEPTION` |
| Reject negative/zero amounts | `IF amount <= 0 THEN RAISE EXCEPTION` |
| Prevent overpayment | `IF amount > balance_due THEN RAISE EXCEPTION` |
| Atomic balance update | `SELECT ... FOR UPDATE` (row lock) |
| Auto-status update | `balance <= 0 → Paid`, `amount_paid > 0 → Partially Paid` |
| Audit trail | Insert into `payments` table + `invoice_status_audit` |

### Credit Note Application Rules

| Rule | Implementation |
|------|----------------|
| Only Issued credit notes can be applied | `IF status != 'Issued' THEN RAISE EXCEPTION` |
| Must be linked to an invoice | `IF invoice_id IS NULL THEN RAISE EXCEPTION` |
| Cannot apply to cancelled invoices | `IF invoice_status = 'Cancelled' THEN RAISE EXCEPTION` |
| Cannot apply to fully paid invoices | `IF invoice_status = 'Paid' THEN RAISE EXCEPTION` |
| Prevent double application | Check `credit_note_applications` table |
| Atomic balance update | `SELECT ... FOR UPDATE` (row lock) |
| Audit trail | Insert into `credit_note_applications` + `credit_note_application_audit` |

### Invoice Voiding Rules

| Rule | Implementation |
|------|----------------|
| Cannot void already cancelled invoices | `IF status = 'Cancelled' THEN RAISE EXCEPTION` |
| Cannot void paid invoices | `IF status = 'Paid' THEN RAISE EXCEPTION` (use credit note) |
| Cannot void invoices with payments | Check `payments` count > 0 |
| Audit trail | Insert into `invoice_status_audit` |

### Payment Reversal Rules

| Rule | Implementation |
|------|----------------|
| Cannot reverse payments on cancelled invoices | `IF invoice_status = 'Cancelled' THEN RAISE EXCEPTION` |
| Soft delete approach | Set `amount = 0`, append reversal note |
| Status recalculation | `amount_paid <= 0 → Sent`, `balance > 0 → Partially Paid` |
| Audit trail | Insert into `invoice_status_audit` |

### Credit Note Cancellation Rules

| Rule | Implementation |
|------|----------------|
| Must be in Applied status | `IF status != 'Applied' THEN RAISE EXCEPTION` |
| Must have application record | Check `credit_note_applications` table |
| Restores invoice balance | `new_balance = old_balance + applied_amount` |
| Removes application record | `DELETE FROM credit_note_applications` |
| Audit trail | Insert into both audit tables |

---

## Test Scenarios

### ✅ Scenario 1: Record a Partial Payment
```
Invoice: INV-0001, Total: R10,000, Balance: R10,000
Action: Record payment of R5,000
Expected:
  - Payment record created
  - amount_paid = R5,000
  - balance_due = R5,000
  - status = 'Partially Paid'
  - Audit log entry created
```

### ✅ Scenario 2: Record Final Payment (Settlement)
```
Invoice: INV-0001, Total: R10,000, Balance: R5,000
Action: Record payment of R5,000
Expected:
  - Payment record created
  - amount_paid = R10,000
  - balance_due = R0
  - status = 'Paid'
  - Audit log entry created
```

### ✅ Scenario 3: Attempt Overpayment
```
Invoice: INV-0001, Total: R10,000, Balance: R5,000
Action: Record payment of R6,000
Expected:
  - ❌ Error: "Payment amount (R6000) exceeds remaining balance (R5000)"
  - No payment recorded
  - No status change
```

### ✅ Scenario 4: Attempt Payment on Cancelled Invoice
```
Invoice: INV-0001, Status: 'Cancelled'
Action: Record payment of R5,000
Expected:
  - ❌ Error: "Cannot record payment on a cancelled invoice"
  - No payment recorded
```

### ✅ Scenario 5: Apply Credit Note to Open Invoice
```
Invoice: INV-0001, Total: R10,000, Balance: R10,000
Credit Note: CN-0001, Amount: R2,000, Status: 'Issued'
Action: Apply credit note
Expected:
  - Credit note status → 'Applied'
  - Invoice balance_due = R8,000
  - Invoice status = 'Partially Paid'
  - credit_note_applications record created
  - Audit log entries created
```

### ✅ Scenario 6: Attempt to Apply Same Credit Note Twice
```
Credit Note: CN-0001, Status: 'Applied'
Action: Apply credit note again
Expected:
  - ❌ Error: "Credit note CN-0001 has already been applied"
  - No changes
```

### ✅ Scenario 7: Cancel an Applied Credit Note
```
Credit Note: CN-0001, Status: 'Applied', Amount: R2,000
Invoice: INV-0001, Balance: R8,000
Action: Cancel applied credit note
Expected:
  - Credit note status → 'Issued'
  - Invoice balance_due = R10,000
  - Invoice status = 'Sent' (if no payments)
  - credit_note_applications record deleted
  - Audit log entries created
```

### ✅ Scenario 8: Verify Invoice Status and Balances
```
After each scenario above:
  - Query invoice: verify total, amount_paid, balance_due, status
  - Query payments: verify payment records
  - Query credit_note_applications: verify application records
  - Query invoice_status_audit: verify audit trail
  - Query credit_note_application_audit: verify CN audit trail
```

---

## Remaining Accounting Limitations

### 1. No Partial Credit Note Application
- **Current:** Credit note is applied in full (`applied_amount = cn_total`)
- **Limitation:** Cannot apply R1,000 of a R2,000 credit note
- **Workaround:** Create separate credit notes for partial amounts
- **Future:** Add `p_amount` parameter to `apply_credit_note_to_invoice`

### 2. No Credit Note Splitting
- **Current:** One credit note applies to one invoice
- **Limitation:** Cannot split a R5,000 credit note across 3 invoices
- **Workaround:** Create separate credit notes per invoice
- **Future:** Add `credit_note_allocations` table for multi-invoice application

### 3. No Automatic Credit Note Generation
- **Current:** Credit notes must be manually created
- **Limitation:** No auto-generation on invoice void/cancel
- **Future:** Add trigger to auto-create credit note when invoice is voided with payments

### 4. No Multi-Currency Support
- **Current:** All amounts in ZAR
- **Limitation:** Cannot handle USD/EUR invoices
- **Future:** Add `currency` column and exchange rate handling

### 5. No Payment Allocation Ordering
- **Current:** Payments are FIFO (first-come, first-served)
- **Limitation:** Cannot prioritize which invoice a payment applies to
- **Future:** Add `payment_allocations` table for explicit allocation

### 6. Audit Trail User Tracking
- **Current:** `performed_by` column exists but not populated by AI actions
- **Limitation:** AI-initiated actions show `performed_by = NULL`
- **Future:** Pass user ID through RPC calls for proper attribution

---

## Quote-to-Invoice Conversion

### Conversion Rules

| Rule | Implementation |
|------|----------------|
| Only Accepted/Sent/Issued quotes can be converted | `IF status NOT IN ('Accepted', 'Sent', 'Issued') THEN RAISE EXCEPTION` |
| Prevent duplicate conversion | `IF converted_invoice_id IS NOT NULL THEN RAISE EXCEPTION` |
| Quote must have line items | `IF item_count = 0 THEN RAISE EXCEPTION` |
| Atomic operation (single transaction) | All steps in one PL/pgSQL function |
| Bidirectional linkage | `invoices.quote_id` ↔ `quotes.converted_invoice_id` |
| Proper invoice number generation | Uses `generate_invoice_number()` |
| Line items copied with sort order preserved | `ORDER BY sort_order` |
| Quote status updated to 'Converted' | Automatic in same transaction |
| Reversal allowed if invoice has no payments | `reverse_quote_conversion()` function |

### Test Scenarios — Quote-to-Invoice Conversion

| Scenario | Expected Result |
|----------|-----------------|
| Convert Accepted quote | ✅ Invoice created, linkage set, status → Converted |
| Convert Sent quote | ✅ Invoice created, linkage set, status → Converted |
| Attempt duplicate conversion | ❌ Error: "already been converted" |
| Convert Draft quote | ❌ Error: "Draft status cannot be converted" |
| Convert Declined quote | ❌ Error: "Declined status cannot be converted" |
| Reverse conversion (no payments) | ✅ Invoice deleted, quote → Accepted |
| Reverse conversion (has payments) | ❌ Error: "has payment(s)" |

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/20260331_finance_hardening.sql` | **NEW** | Schema fixes, constraints, audit tables, DB functions |
| `supabase/migrations/20260331_quote_to_invoice_conversion.sql` | **NEW** | Atomic conversion function, linkage columns |
| `app/api/chat/route.ts` | **MODIFIED** | Updated `executeMarkInvoicePaid`, `executeVoidInvoice`, `executeConvertQuoteToInvoice` |
| `lib/office/creditNoteActions.ts` | **MODIFIED** | Added 4 new server action functions |
| `lib/quotes/quoteActions.ts` | **NEW** | Server actions for UI conversion |
| `app/office/quotes/[id]/QuoteDetailClient.tsx` | **MODIFIED** | Updated UI to use server action |

---

## Deployment Checklist

- [ ] Run migration: `supabase migration up`
- [ ] Verify credit_notes status constraint includes all 5 statuses
- [ ] Verify cn_number column exists and is populated
- [ ] Test payment recording with partial and full payments
- [ ] Test overpayment rejection
- [ ] Test payment on cancelled invoice rejection
- [ ] Test credit note application
- [ ] Test double-application prevention
- [ ] Test credit note cancellation
- [ ] Test invoice voiding with and without payments
- [ ] Verify audit tables are populated after each operation
- [ ] Verify invoice_payment_summary view returns correct data

---

## API Reference

### Database Functions

#### `record_invoice_payment(p_invoice_id, p_amount, p_payment_date?, p_payment_method?, p_reference?, p_notes?)`
Returns: `{ success, payment_id, invoice_number, previous_status, new_status, amount_paid, balance_due, invoice_total }`

#### `apply_credit_note_to_invoice(p_credit_note_id)`
Returns: `{ success, credit_note_number, invoice_number, credit_note_amount, previous_invoice_balance, new_invoice_balance, previous_invoice_status, new_invoice_status }`

#### `void_invoice_with_reversal(p_invoice_id, p_reason?)`
Returns: `{ success, invoice_number, previous_status, new_status }`

#### `reverse_payment(p_payment_id, p_reason?)`
Returns: `{ success, invoice_number, reversed_amount, new_amount_paid, new_balance_due, new_status }`

#### `cancel_applied_credit_note(p_credit_note_id, p_reason?)`
Returns: `{ success, credit_note_number, invoice_number, reversed_amount, new_invoice_balance, new_invoice_status }`

### Server Actions (creditNoteActions.ts)

```typescript
applyCreditNote(id: string)
cancelAppliedCreditNote(id: string, reason?: string)
reversePayment(paymentId: string, reason?: string)
voidInvoiceWithReversal(invoiceId: string, reason?: string)
```

---

## Support

For questions or issues with the finance hardening implementation, refer to:
- Migration file: `supabase/migrations/20260331_finance_hardening.sql`
- Status transitions: `lib/office/status-actions.ts`
- AI assistant tools: `app/api/chat/route.ts`