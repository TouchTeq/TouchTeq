# Feature Specs — Statement Import & Smart Tax Assistant

Status: **Spec / not yet built**
Context: TouchTeq Office (Next.js 15 App Router + Supabase, ZAR, SA VAT 15%).
Audience: one-person SA business with irregular income. Goal: Sage-style linkage
(quotes → invoices → credit notes → payments) plus two new pillars below.

These specs reference the *existing* schema and RPCs:
- `invoices(total, amount_paid, balance_due, status, invoice_number, client_id, ...)`
- `payments(invoice_id, client_id, payment_date, amount, payment_method, reference, notes)`
- `expenses(expense_date, supplier_name, description, category, amount_inclusive, vat_claimable, vat_amount, input_vat_amount, amount_exclusive, payment_status, ...)`
- RPC `record_invoice_payment(p_invoice_id, p_amount, p_payment_date, p_payment_method, p_reference, p_notes)` → returns JSONB and recalculates status/balance atomically.
- `business_profile(id, opening_balance, ...)`

Conventions to follow: server actions in `lib/<module>/actions.ts` (`'use server'`),
pages under `app/office/<module>/`, client tables as `*TableClient.tsx`, toasts via
`useOfficeToast`, RLS policies mirroring existing tables (`auth.uid() IS NOT NULL`).

---

## FEATURE A — Bank / Financial-Statement Import & Reconciliation

### A.1 Outcome
Upload a bank statement → transactions are parsed and stored → money-in auto-matches
open invoices (and records payment via the existing RPC) → money-out auto-matches or
creates expenses → an explicit reconciliation queue handles the rest. No more manual
re-entry; the dashboard/cash-flow/tax numbers all read from reconciled data.

### A.2 Data model (new migration `supabase/migrations/<date>_bank_statements.sql`)

```sql
create table public.statement_imports (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'csv',          -- 'csv' | 'ofx' | 'pdf'
  bank_name text,                                -- FNB | Standard Bank | ABSA | Nedbank | Capitec | Other
  account_label text,
  file_name text,
  row_count int not null default 0,
  matched_count int not null default 0,
  date_from date,
  date_to date,
  status text not null default 'imported'        -- imported | reconciling | reconciled
    check (status in ('imported','reconciling','reconciled')),
  created_at timestamptz not null default now()
);

create table public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.statement_imports(id) on delete cascade,
  txn_date date not null,
  description text,
  reference text,                                -- parsed payment ref where present
  amount numeric(15,2) not null,                 -- signed: +in / -out
  direction text not null check (direction in ('in','out')),
  running_balance numeric(15,2),
  -- reconciliation
  status text not null default 'unmatched'       -- unmatched | suggested | matched | ignored
    check (status in ('unmatched','suggested','matched','ignored')),
  matched_type text check (matched_type in ('invoice','expense','payment')),
  matched_id uuid,
  match_confidence numeric(5,2),                 -- 0..100
  dedupe_hash text,                              -- date|amount|description hash; unique guard
  created_at timestamptz not null default now()
);

create unique index bank_txn_dedupe_uq on public.bank_transactions(dedupe_hash);
create index bank_txn_import_idx on public.bank_transactions(import_id);
create index bank_txn_status_idx on public.bank_transactions(status);

alter table public.statement_imports enable row level security;
alter table public.bank_transactions enable row level security;
-- policies: select/insert/update/delete using (auth.uid() is not null)  [mirror existing tables]
```

`dedupe_hash` prevents importing the same statement twice (re-uploads skip existing rows).

### A.3 Parsing
- **Phase 1 — CSV** (covers every major SA bank). Use `papaparse` (already a dependency).
  Column-mapping UI: user maps their CSV headers → {date, description, amount | debit/credit, balance}.
  Persist last mapping per `bank_name` in `business_profile.document_settings` so repeat
  imports are one click.
- Normalise amount: if separate debit/credit columns, derive signed `amount` + `direction`.
- **Phase 2 — OFX/PDF**: OFX via a small parser; PDF via existing `pdf` skill / server parse.
  Defer until CSV flow is proven.

### A.4 Auto-match engine (`lib/bank/matching.ts`)
Money **in** (`direction='in'`):
1. Exact: open invoice (`status in ('Sent','Overdue','Partially Paid')`, `balance_due>0`)
   where `balance_due == amount` AND invoice_number appears in description/reference → confidence 100.
2. Reference: invoice_number token match → 90.
3. Amount-only within ±R0.00 and date window → 70 (suggested, needs confirm).
4. On confirm → call `record_invoice_payment(invoice_id, amount, txn_date, 'EFT', reference, 'Auto-matched from statement <import>')`;
   set txn `status='matched', matched_type='payment', matched_id=<payment_id>`.

Money **out** (`direction='out'`):
1. Match existing `expenses` by amount + date window + supplier/description fuzzy → suggested.
2. If no match → "Create expense from transaction" prefilled (supplier_name←description,
   amount_inclusive←|amount|, expense_date←txn_date, vat split via `lib/vat/utils`).

### A.5 Server actions (`lib/bank/actions.ts`)
`createImport(rows, meta)`, `getImports()`, `getTransactions(importId, statusFilter)`,
`autoMatchImport(importId)` (runs engine, sets suggestions), `confirmMatch(txnId, type, targetId)`
(calls RPC for invoices), `createExpenseFromTxn(txnId, expenseInput)`, `ignoreTxn(txnId)`,
`unmatchTxn(txnId)` (reverses payment via existing `reverse_payment` when needed).

### A.6 UI (`app/office/bank/`)
- `page.tsx` — imports list + "Import Statement" button; KPIs (unmatched, suggested, reconciled %).
- `import/page.tsx` — upload + column-mapping wizard (client).
- `[importId]/ReconcileClient.tsx` — two-pane reconcile screen: transactions with
  confidence badges, inline "Confirm / Change / Ignore / Create expense".
- Nav: add **Bank / Reconcile** to the OPERATIONS group in `app/office/layout.tsx`
  (next to Cash Flow) + command-palette entries.

### A.7 Phasing
1. Migration + CSV import + storage + dedupe.
2. Auto-match money-in → invoices (highest value; reuses payment RPC).
3. Reconcile UI + money-out/expense creation.
4. OFX/PDF parsing.

### A.8 Risks / guards
- Never auto-create payments without overpayment guard — the RPC already rejects
  `amount > balance_due`, so confidence-3 matches must be user-confirmed.
- Idempotent re-import via `dedupe_hash`.
- All amounts ZAR `numeric(15,2)`; no float math.

---

## FEATURE B — Smart Tax / Provisional-Tax Assistant (irregular income)

### B.1 Outcome
As irregular payments land, the system tracks cumulative **taxable income**
(paid invoices − deductible expenses), estimates the tax owed using SARS tables,
recommends an amount to **set aside per payment**, and warns ahead of **IRP6**
provisional-tax deadlines — especially when cash is tight. Removes the "no income
came in, now I can't pay my tax bill" surprise.

### B.2 SA tax facts encoded (config, not hard-coded in components)
- Provisional taxpayers file **IRP6** twice yearly: **1st period** (due last day of Aug),
  **2nd period** (due last day of Feb), plus optional **3rd / top-up** (within ~6–7 months
  of year-end). Tax year ends end of Feb.
- Liability estimated from annual **SARS individual tax tables + rebates + tax threshold**
  (sole prop is taxed in the individual's hands). Tables change yearly → store per tax-year.
- VAT already handled by the existing `vat` module — the tax assistant covers **income tax**,
  not VAT.

Store rates in a small versioned config `lib/tax/sars-tables.ts` (per tax year:
brackets, primary/secondary rebates, threshold) so yearly updates are a one-file change.

### B.3 Data model (new migration `<date>_tax_assistant.sql`)

```sql
create table public.tax_settings (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null default 'sole_proprietor'
    check (entity_type in ('sole_proprietor','company','other')),
  is_provisional_taxpayer boolean not null default true,
  tax_year_end_month int not null default 2,     -- Feb
  set_aside_pct numeric(5,2),                     -- optional manual override; else computed
  age_band text default 'under_65',               -- affects rebates
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tax_estimates (
  id uuid primary key default gen_random_uuid(),
  tax_year text not null,                          -- e.g. '2026/2027'
  period text not null check (period in ('P1','P2','P3','annual')),
  taxable_income numeric(15,2) not null default 0,
  estimated_tax numeric(15,2) not null default 0,
  already_set_aside numeric(15,2) not null default 0,
  due_date date,
  status text not null default 'projected'         -- projected | filed | paid
    check (status in ('projected','filed','paid')),
  computed_at timestamptz not null default now()
);
```

Set-aside ledger can reuse `payments` (read-only) for income events; reserved cash is a
derived figure (no separate bank movement) shown as "recommended reserve."

### B.4 Engine (`lib/tax/engine.ts`)
- `getTaxableIncomeToDate(taxYear)`: sum `payments.amount` in tax year
  (cash basis — income when *paid*, matching irregular-income reality)
  − deductible expenses (`expenses` where `category` is deductible; exclude capital).
- `estimateAnnualTax(taxableIncome, taxYear, ageBand)`: apply `sars-tables.ts`
  brackets − rebates; floor at 0 below threshold.
- `recommendedSetAside(payment)`: marginal-rate-based % of each incoming payment
  (effective average rate on projected annual income), so lumpy months self-reserve.
- `provisionalSchedule(taxYear)`: compute P1/P2/P3 due dates + required payment
  (P1 = 50% of estimated annual; P2 = 100% − P1 paid; P3 top-up).

### B.5 Server actions (`lib/tax/actions.ts`)
`getTaxSettings()`, `saveTaxSettings()`, `getTaxDashboard()` (income-to-date,
estimated owed, set-aside vs. owed, next deadline), `recomputeEstimates(taxYear)`,
`markPeriodFiled(period)`.

### B.6 UI
- `app/office/tax/page.tsx` — Tax Centre: tiles for *Taxable income YTD*,
  *Estimated tax owed*, *Recommended reserve vs. set aside*, *Next IRP6 deadline*;
  provisional schedule table (P1/P2/P3, due, amount, status); deductible-expense summary.
- **Dashboard tile**: "Tax set aside vs. estimated owed" + days to next IRP6.
- **Reminders integration**: auto-create reminders for P1/P2/P3 due dates via existing
  `createReminder`; escalate (red) when a deadline is <30 days out AND projected
  30-day cash-flow balance < estimated amount due (reads the cash-flow projection).
- Nav: add **Tax Centre** to OPERATIONS group + command palette.
- Settings: add a **Tax** tab to `app/office/settings/` for `tax_settings`.

### B.7 Cash-flow tie-in (absorbs earlier improvement note)
Extend `app/office/cash-flow/page.tsx` to overlay **upcoming provisional-tax payments**
as scheduled money-out, and to model **recurring expenses** + **actual payment timing**
(not just invoice due dates) so the gap detector reflects reality.

### B.8 Phasing
1. `tax_settings` + `sars-tables.ts` (current year) + settings tab.
2. Engine: taxable income YTD + annual estimate + Tax Centre page.
3. Set-aside recommendation + dashboard tile.
4. IRP6 schedule + reminder/cash-aware escalation + cash-flow overlay.

### B.9 Disclaimers / guards
- Label clearly as an **estimate / planning aid, not tax advice or a SARS submission**.
- SARS tables versioned by year; show which table version a figure used.
- Cash basis for income (paid invoices) is deliberate for irregular income; expense
  deductibility flags should be reviewed with an accountant — surface that in-app.

---

## Suggested overall build order
A.1–A.2 → A.4 money-in (immediate payoff, reuses RPC) → B.1–B.2 → B engine/page →
A reconcile UI → B reminders + cash-flow overlay → A OFX/PDF. A produces the clean
paid/expense data that B's estimates depend on, so A's money-in matching should land first.
