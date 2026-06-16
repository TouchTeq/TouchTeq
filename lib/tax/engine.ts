/**
 * Pure tax-calculation helpers (no DB access). Income-tax planning aid for a
 * sole proprietor with irregular income — estimates only, not tax advice.
 */

import { getTaxTable, type TaxTable } from '@/lib/tax/sars-tables';

export type AgeBand = 'under_65' | '65_to_74' | '75_plus';

/**
 * SA tax year runs 1 March → end Feb. For any date, returns the label
 * 'YYYY/YYYY' of the tax year it falls in.
 */
export function taxYearForDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0=Jan ... 2=Mar
  // On/after 1 March → year starts this calendar year; before → previous.
  const startYear = m >= 2 ? y : y - 1;
  return `${startYear}/${startYear + 1}`;
}

/** Start (1 Mar) and end (28/29 Feb) dates for a 'YYYY/YYYY' tax year. */
export function taxYearBounds(taxYear: string): { start: string; end: string } {
  const startYear = parseInt(taxYear.split('/')[0], 10);
  const start = `${startYear}-03-01`;
  // End = last day of Feb of the following year (handles leap years via day 0 of March)
  const endDate = new Date(startYear + 1, 2, 0);
  const end = `${startYear + 1}-02-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

export interface ProvisionalPeriod {
  period: 'P1' | 'P2' | 'P3';
  label: string;
  dueDate: string; // YYYY-MM-DD
  /** Portion of the estimated annual tax due by this period. */
  amountDue: number;
}

/**
 * IRP6 schedule for individuals (Feb year-end):
 *   P1 — due 31 Aug (in-year): 50% of estimated annual tax
 *   P2 — due end Feb (year-end): remaining 100% − P1
 *   P3 — voluntary top-up, due 30 Sep after year-end
 */
export function provisionalSchedule(taxYear: string, estimatedAnnualTax: number): ProvisionalPeriod[] {
  const startYear = parseInt(taxYear.split('/')[0], 10);
  const p1 = Math.max(0, Math.round((estimatedAnnualTax / 2) * 100) / 100);
  const p2 = Math.max(0, Math.round((estimatedAnnualTax - p1) * 100) / 100);
  const febEnd = new Date(startYear + 1, 2, 0).getDate();
  return [
    { period: 'P1', label: '1st provisional (IRP6)', dueDate: `${startYear}-08-31`, amountDue: p1 },
    { period: 'P2', label: '2nd provisional (IRP6)', dueDate: `${startYear + 1}-02-${String(febEnd).padStart(2, '0')}`, amountDue: p2 },
    { period: 'P3', label: '3rd / top-up (voluntary)', dueDate: `${startYear + 1}-09-30`, amountDue: 0 },
  ];
}

function rebateForAge(table: TaxTable, ageBand: AgeBand): number {
  let r = table.rebates.primary;
  if (ageBand === '65_to_74' || ageBand === '75_plus') r += table.rebates.secondary;
  if (ageBand === '75_plus') r += table.rebates.tertiary;
  return r;
}

function thresholdForAge(table: TaxTable, ageBand: AgeBand): number {
  if (ageBand === '75_plus') return table.thresholds.age_75_plus;
  if (ageBand === '65_to_74') return table.thresholds.age_65_to_74;
  return table.thresholds.under_65;
}

export interface TaxEstimate {
  taxYear: string;
  taxableIncome: number;
  taxBeforeRebates: number;
  rebates: number;
  estimatedTax: number;
  /** Effective average rate on taxable income (0..1). */
  effectiveRate: number;
  /** Marginal rate of the top bracket reached (0..1). */
  marginalRate: number;
  tableVerified: boolean;
  belowThreshold: boolean;
}

/**
 * Estimate annual income tax for a given taxable income. Returns nulls-safe
 * zeroes when no table exists for the year (caller should surface a warning).
 */
export function estimateAnnualTax(taxableIncome: number, taxYear: string, ageBand: AgeBand): TaxEstimate | null {
  const table = getTaxTable(taxYear);
  if (!table) return null;

  const income = Math.max(0, taxableIncome);
  const threshold = thresholdForAge(table, ageBand);

  let taxBeforeRebates = 0;
  let marginalRate = 0;
  for (const b of table.brackets) {
    if (income > b.from) {
      const upper = b.to == null ? income : Math.min(income, b.to);
      taxBeforeRebates = b.base + (upper - b.from) * b.rate;
      marginalRate = b.rate;
    }
  }

  const rebates = rebateForAge(table, ageBand);
  const estimatedTax = Math.max(0, Math.round((taxBeforeRebates - rebates) * 100) / 100);
  const effectiveRate = income > 0 ? estimatedTax / income : 0;

  return {
    taxYear,
    taxableIncome: income,
    taxBeforeRebates: Math.round(taxBeforeRebates * 100) / 100,
    rebates,
    estimatedTax,
    effectiveRate,
    marginalRate,
    tableVerified: table.verified,
    belowThreshold: income <= threshold,
  };
}

/**
 * Recommended amount to reserve from a single incoming payment, based on the
 * effective average rate on projected annual income. Keeps lumpy income honest.
 */
export function recommendedSetAside(paymentAmount: number, effectiveRate: number, overridePct?: number | null): number {
  const rate = overridePct != null ? overridePct / 100 : effectiveRate;
  return Math.max(0, Math.round(paymentAmount * rate * 100) / 100);
}
