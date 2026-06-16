/**
 * Bank statement → invoice matching engine (Feature A).
 *
 * Pure functions only — no DB access. The server action loads candidates,
 * calls `matchTransactionToInvoices`, and persists the suggestion. Matches are
 * only ever *suggested*; recording a payment always requires explicit user
 * confirmation (see lib/bank/actions.ts), because record_invoice_payment is a
 * hard-to-reverse financial mutation.
 */

export interface OpenInvoice {
  id: string;
  invoice_number: string;
  balance_due: number;
  total: number;
  due_date?: string | null;
}

export interface MatchableTxn {
  amount: number; // signed; money-in is positive
  description: string | null;
  reference: string | null;
}

export interface MatchSuggestion {
  invoiceId: string;
  invoiceNumber: string;
  confidence: number; // 0..100
  reason: string;
}

const CENTS_EPSILON = 0.005;

function normalize(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Trailing run of >=4 digits in an invoice number, e.g. "INV-2026-0001" -> "0001". */
function numericTail(invoiceNumber: string): string | null {
  const m = invoiceNumber.match(/(\d{4,})\s*$/);
  return m ? m[1] : null;
}

function amountsEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < CENTS_EPSILON;
}

/**
 * Returns the best invoice suggestion for a money-in transaction, or null.
 *
 * Scoring:
 *   100 — balance matches exactly AND invoice number appears in the description/reference
 *    90 — invoice number appears but amount differs (likely partial / over time)
 *    70 — amount matches exactly, no reference (unique amount)
 *    55 — amount matches exactly but is ambiguous (>1 open invoice shares it)
 */
export function matchTransactionToInvoices(
  txn: MatchableTxn,
  openInvoices: OpenInvoice[]
): MatchSuggestion | null {
  const amountIn = Math.abs(txn.amount);
  if (amountIn <= 0 || openInvoices.length === 0) return null;

  const hay = normalize(`${txn.description ?? ''} ${txn.reference ?? ''}`);

  const amountMatches = openInvoices.filter((inv) => amountsEqual(inv.balance_due, amountIn));
  const amountAmbiguous = amountMatches.length > 1;

  const scored = openInvoices.map((inv) => {
    const invNorm = normalize(inv.invoice_number);
    const tail = numericTail(inv.invoice_number);
    const numberMatch =
      (invNorm.length >= 4 && hay.includes(invNorm)) || (!!tail && hay.includes(tail));
    const amountMatch = amountsEqual(inv.balance_due, amountIn);

    let confidence = 0;
    let reason = '';
    if (amountMatch && numberMatch) {
      confidence = 100;
      reason = `Exact amount + invoice ${inv.invoice_number} in reference`;
    } else if (numberMatch) {
      confidence = 90;
      reason = `Invoice ${inv.invoice_number} referenced (amount differs — possible partial)`;
    } else if (amountMatch && !amountAmbiguous) {
      confidence = 70;
      reason = 'Exact amount match';
    } else if (amountMatch && amountAmbiguous) {
      confidence = 55;
      reason = `Amount matches ${amountMatches.length} open invoices — confirm which`;
    }

    return { inv, confidence, reason };
  });

  scored.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    // tie-break: closest balance, then soonest due date
    const da = Math.abs(a.inv.balance_due - amountIn);
    const db = Math.abs(b.inv.balance_due - amountIn);
    if (da !== db) return da - db;
    return (a.inv.due_date ?? '').localeCompare(b.inv.due_date ?? '');
  });

  const best = scored[0];
  if (!best || best.confidence <= 0) return null;
  return {
    invoiceId: best.inv.id,
    invoiceNumber: best.inv.invoice_number,
    confidence: best.confidence,
    reason: best.reason,
  };
}
