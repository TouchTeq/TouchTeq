/**
 * SARS individual income-tax tables, versioned by tax year.
 *
 * ⚠️ VERIFY BEFORE RELYING ON THESE NUMBERS.
 * A sole proprietor is taxed in the individual's hands, so these are the
 * individual rates/rebates/thresholds. SARS adjusts them most years in the
 * February Budget. To add a new year, append an entry to TAX_TABLES — the
 * engine picks the table whose `taxYear` matches, and warns if none exists.
 *
 * The 2025/2026 figures below are the last set confirmed at build time
 * (brackets were not inflation-adjusted from 2024/2025). The CURRENT active
 * provisional year is 2026/2027 — copy 2025/2026 forward and confirm the
 * 2026/2027 values against the official SARS tables before trusting estimates.
 */

export interface TaxBracket {
  /** Lower bound (inclusive) of taxable income for this bracket. */
  from: number;
  /** Upper bound (inclusive), or null for the top bracket. */
  to: number | null;
  /** Cumulative tax at `from`. */
  base: number;
  /** Marginal rate above `from` (0..1). */
  rate: number;
}

export interface TaxTable {
  taxYear: string; // 'YYYY/YYYY'
  verified: boolean; // false = must be confirmed against SARS before use
  brackets: TaxBracket[];
  rebates: {
    primary: number; // all individuals
    secondary: number; // 65+
    tertiary: number; // 75+
  };
  /** Income below the threshold (for the relevant age band) pays no tax. */
  thresholds: {
    under_65: number;
    age_65_to_74: number;
    age_75_plus: number;
  };
}

export const TAX_TABLES: TaxTable[] = [
  {
    taxYear: '2025/2026',
    verified: true,
    brackets: [
      { from: 0, to: 237100, base: 0, rate: 0.18 },
      { from: 237100, to: 370500, base: 42678, rate: 0.26 },
      { from: 370500, to: 512800, base: 77362, rate: 0.31 },
      { from: 512800, to: 673000, base: 121475, rate: 0.36 },
      { from: 673000, to: 857900, base: 179147, rate: 0.39 },
      { from: 857900, to: 1817000, base: 251258, rate: 0.41 },
      { from: 1817000, to: null, base: 644489, rate: 0.45 },
    ],
    rebates: { primary: 17235, secondary: 9444, tertiary: 3145 },
    thresholds: { under_65: 95750, age_65_to_74: 148217, age_75_plus: 165689 },
  },
  {
    // Placeholder: copied from 2025/2026. CONFIRM against SARS Budget 2026.
    taxYear: '2026/2027',
    verified: false,
    brackets: [
      { from: 0, to: 237100, base: 0, rate: 0.18 },
      { from: 237100, to: 370500, base: 42678, rate: 0.26 },
      { from: 370500, to: 512800, base: 77362, rate: 0.31 },
      { from: 512800, to: 673000, base: 121475, rate: 0.36 },
      { from: 673000, to: 857900, base: 179147, rate: 0.39 },
      { from: 857900, to: 1817000, base: 251258, rate: 0.41 },
      { from: 1817000, to: null, base: 644489, rate: 0.45 },
    ],
    rebates: { primary: 17235, secondary: 9444, tertiary: 3145 },
    thresholds: { under_65: 95750, age_65_to_74: 148217, age_75_plus: 165689 },
  },
];

export function getTaxTable(taxYear: string): TaxTable | null {
  return TAX_TABLES.find((t) => t.taxYear === taxYear) ?? null;
}
