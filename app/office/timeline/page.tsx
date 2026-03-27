import { createClient } from '@/lib/supabase/server';
import TimelineClient, { type TimelineEvent } from './TimelineClient';

export const dynamic = 'force-dynamic';

function toIso(value: any): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function pickCompanyName(maybe: any): string | undefined {
  if (!maybe) return undefined;
  if (Array.isArray(maybe)) return maybe[0]?.company_name || undefined;
  return maybe.company_name || undefined;
}

export default async function TimelinePage() {
  const supabase = await createClient();

  const [clientsRes, quotesRes, invoicesRes, paymentsRes, remindersRes, expensesRes] = await Promise.all([
    supabase.from('clients').select('id, company_name, is_active, created_at').order('created_at', { ascending: false }).limit(25),
    supabase
      .from('quotes')
      .select('id, quote_number, total, status, created_at, client_id, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('invoices')
      .select('id, invoice_number, total, status, created_at, client_id, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('payments')
      .select('id, amount, created_at, payment_date, invoices(id, invoice_number, client_id, clients(company_name))')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('reminder_logs')
      .select('id, status, sent_at, invoices(id, invoice_number, client_id, clients(company_name))')
      .order('sent_at', { ascending: false })
      .limit(25),
    supabase
      .from('expenses')
      .select('id, created_at, expense_date, description, supplier_name, amount_inclusive')
      .order('expense_date', { ascending: false })
      .limit(25),
  ]);

  const events: TimelineEvent[] = [];

  for (const c of clientsRes.data || []) {
    const ts = toIso(c.created_at);
    if (!ts) continue;
    events.push({
      id: `client:${c.id}`,
      kind: 'client',
      ts,
      title: c.company_name ? `Client added: ${c.company_name}` : 'Client added',
      subtitle: c.is_active ? 'Status: Active' : 'Status: Inactive',
      href: `/office/clients/${c.id}`,
    });
  }

  for (const q of quotesRes.data || []) {
    const ts = toIso(q.created_at);
    if (!ts) continue;
    events.push({
      id: `quote:${q.id}`,
      kind: 'quote',
      ts,
      title: q.quote_number ? `Quote created: ${q.quote_number}` : 'Quote created',
      subtitle: pickCompanyName(q.clients),
      amount: q.total ?? undefined,
      status: q.status ?? undefined,
      href: `/office/quotes/${q.id}`,
    });
  }

  for (const i of invoicesRes.data || []) {
    const ts = toIso(i.created_at);
    if (!ts) continue;
    events.push({
      id: `invoice:${i.id}`,
      kind: 'invoice',
      ts,
      title: i.invoice_number ? `Invoice created: ${i.invoice_number}` : 'Invoice created',
      subtitle: pickCompanyName(i.clients),
      amount: i.total ?? undefined,
      status: i.status ?? undefined,
      href: `/office/invoices/${i.id}`,
    });
  }

  for (const p of paymentsRes.data || []) {
    const ts = toIso(p.created_at) || toIso(p.payment_date);
    if (!ts) continue;
    const invoice = Array.isArray(p.invoices) ? p.invoices[0] : p.invoices;
    const invoiceNo = invoice?.invoice_number;
    const clientName = pickCompanyName(invoice?.clients);
    const invoiceId = invoice?.id;
    events.push({
      id: `payment:${p.id}`,
      kind: 'payment',
      ts,
      title: 'Payment recorded',
      subtitle: [invoiceNo ? `Invoice ${invoiceNo}` : null, clientName].filter(Boolean).join(' • ') || undefined,
      amount: p.amount ?? undefined,
      status: 'Success',
      href: invoiceId ? `/office/invoices/${invoiceId}` : '/office/invoices',
    });
  }

  for (const r of remindersRes.data || []) {
    const ts = toIso(r.sent_at);
    if (!ts) continue;
    const invoice = Array.isArray(r.invoices) ? r.invoices[0] : r.invoices;
    const invoiceNo = invoice?.invoice_number;
    const clientName = pickCompanyName(invoice?.clients);
    const invoiceId = invoice?.id;
    events.push({
      id: `reminder:${r.id}`,
      kind: 'reminder',
      ts,
      title: 'Payment reminder sent',
      subtitle: [invoiceNo ? `Invoice ${invoiceNo}` : null, clientName].filter(Boolean).join(' • ') || undefined,
      status: r.status ?? undefined,
      href: invoiceId ? `/office/invoices/${invoiceId}?action=reminder` : '/office/reminders',
    });
  }

  for (const e of expensesRes.data || []) {
    const ts = toIso(e.created_at) || toIso(e.expense_date);
    if (!ts) continue;
    const label = e.supplier_name || e.description || 'Expense';
    events.push({
      id: `expense:${e.id}`,
      kind: 'expense',
      ts,
      title: `Expense logged: ${label}`,
      subtitle: e.description && e.supplier_name ? e.description : undefined,
      amount: e.amount_inclusive ?? undefined,
      href: `/office/expenses/${e.id}`,
    });
  }

  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Unified Timeline</h1>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
          One feed for clients, quotes, invoices, payments, reminders, and expenses
        </p>
      </div>

      <TimelineClient events={events.slice(0, 150)} />
    </div>
  );
}
