/**
 * Statement parsers (client-safe, no deps beyond date-fns).
 *
 * All parsers converge on ParsedRow[] which feeds the same createImport
 * pipeline as CSV. Amounts are signed (+in / -out); direction is derived
 * server-side. Every parsed row is shown in the preview for verification
 * before anything is saved — important for the heuristic text parser.
 */

import { parse as parseDate, format as formatDate, isValid } from 'date-fns';
import type { ParsedRow } from '@/lib/bank/actions';

/** Parse a money string: handles "1,234.56", "(123.45)", "R 1 234,56", trailing -. */
export function parseAmount(raw: unknown): number {
  if (raw == null) return NaN;
  let s = String(raw).trim();
  if (!s) return NaN;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  // trailing Cr/Dr markers common on SA statements
  if (/dr\.?$/i.test(s)) negative = true;
  s = s.replace(/[^\d.,-]/g, '');
  if (s.includes('-')) {
    if (s.trimStart().startsWith('-') || s.trimEnd().endsWith('-')) negative = true;
    s = s.replace(/-/g, '');
  }
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma) {
    const after = s.split(',').pop() ?? '';
    if (after.length <= 2) s = s.replace(/,/g, '.');
    else s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  if (isNaN(n)) return NaN;
  return negative ? -n : n;
}

/**
 * Parse an OFX (or QFX) statement. Works for both OFX 1.x (SGML, unclosed
 * tags) and 2.x (XML) because we read each tag value up to the next tag/newline.
 */
export function parseOfx(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const tagValue = (block: string, name: string): string => {
    const m = block.match(new RegExp(`<${name}>\\s*([^<\\r\\n]+)`, 'i'));
    return m ? m[1].trim() : '';
  };
  for (const b of blocks) {
    const dt = tagValue(b, 'DTPOSTED');
    const amt = tagValue(b, 'TRNAMT');
    if (dt.length < 8 || !amt) continue;
    const y = dt.slice(0, 4);
    const mo = dt.slice(4, 6);
    const d = dt.slice(6, 8);
    const amount = parseAmount(amt);
    if (isNaN(amount) || amount === 0) continue;
    const name = tagValue(b, 'NAME');
    const memo = tagValue(b, 'MEMO');
    const fitid = tagValue(b, 'FITID');
    rows.push({
      txn_date: `${y}-${mo}-${d}`,
      description: [name, memo].filter(Boolean).join(' — ') || 'OFX transaction',
      reference: fitid || null,
      amount: Math.round(amount * 100) / 100,
      running_balance: null,
    });
  }
  return rows;
}

const DATE_PREFIX = [
  /^(\d{4}[-/]\d{1,2}[-/]\d{1,2})/, // 2026-03-27 / 2026/03/27
  /^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/, // 27/03/2026
  /^(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/, // 27 Mar 2026
];

/**
 * Heuristic parser for statement text pasted out of a PDF/email. For each line
 * with a leading date and at least one money value: date → txn_date,
 * middle text → description, last money token → running balance (if 2+),
 * the transaction amount → the preceding money token (or the only one).
 *
 * Best-effort: the caller MUST let the user verify rows in the preview.
 */
export function parseStatementText(text: string, dateFmt: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const moneyToken = /\(?-?[R\s]*\d[\d ,]*\.?\d{0,2}\)?(?:\s?[CD]r)?/gi;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    let dateStr = '';
    for (const re of DATE_PREFIX) {
      const m = line.match(re);
      if (m) {
        dateStr = m[1];
        break;
      }
    }
    if (!dateStr) continue;

    const d = parseDate(dateStr, dateFmt, new Date());
    if (!isValid(d)) continue;

    const rest = line.slice(dateStr.length);
    const tokens = rest.match(moneyToken)?.map((t) => t.trim()).filter((t) => /\d/.test(t)) ?? [];
    if (tokens.length === 0) continue;

    let amount: number;
    let balance: number | null = null;
    if (tokens.length >= 2) {
      amount = parseAmount(tokens[tokens.length - 2]);
      balance = parseAmount(tokens[tokens.length - 1]);
      if (isNaN(balance)) balance = null;
    } else {
      amount = parseAmount(tokens[0]);
    }
    if (isNaN(amount) || amount === 0) continue;

    // Description = text between date and the first money token
    const firstTokenIdx = rest.search(moneyToken);
    const description = (firstTokenIdx > 0 ? rest.slice(0, firstTokenIdx) : rest).trim() || 'Statement line';

    rows.push({
      txn_date: formatDate(d, 'yyyy-MM-dd'),
      description,
      reference: null,
      amount: Math.round(amount * 100) / 100,
      running_balance: balance,
    });
  }
  return rows;
}
