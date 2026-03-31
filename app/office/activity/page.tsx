import { createClient } from '@/lib/supabase/server';
import ActivityClient from './ActivityClient';

export default async function ActivityPage() {
  const supabase = await createClient();

  const [quotesRes, invoicesRes, paymentsRes, expensesRes, certificatesRes, posRes, creditNotesRes] = await Promise.all([
    supabase.from('quotes').select('*, clients(company_name)').order('created_at', { ascending: false }),
    supabase.from('invoices').select('*, clients(company_name)').order('created_at', { ascending: false }),
    supabase.from('payments').select('*, invoices(invoice_number, clients(company_name))').order('created_at', { ascending: false }),
    supabase.from('expenses').select('*, clients(company_name)').order('created_at', { ascending: false }),
    supabase.from('certificates').select('*, clients(company_name)').order('created_at', { ascending: false }),
    supabase.from('purchase_orders').select('*, clients(company_name)').order('created_at', { ascending: false }),
    supabase.from('credit_notes').select('*, clients(company_name)').order('created_at', { ascending: false }),
  ]);

  const activities = [
    ...(quotesRes.data?.filter(q => q.clients !== null).map(q => ({
      id: q.id, type: 'Quote', ref: q.quote_number, client: q.clients?.company_name, amount: q.total, status: q.status, date: q.created_at
    })) || []),
    ...(invoicesRes.data?.filter(i => i.clients !== null).map(i => ({
      id: i.id, type: 'Invoice', ref: i.invoice_number, client: i.clients?.company_name, amount: i.total, status: i.status, date: i.created_at
    })) || []),
    ...(paymentsRes.data?.filter(p => p.invoices?.clients !== null).map(p => ({
      id: p.id, type: 'Payment', ref: p.invoices?.invoice_number, client: p.invoices?.clients?.company_name, amount: p.amount, status: 'Success', date: p.created_at
    })) || []),
    ...(expensesRes.data?.filter(e => e.clients !== null).map(e => ({
      id: e.id, type: 'Expense', ref: e.reference || `EXP-${e.id.slice(0, 8)}`, client: e.clients?.company_name, amount: e.amount_inclusive, status: e.status || 'Completed', date: e.created_at
    })) || []),
    ...(certificatesRes.data?.filter(c => c.clients !== null).map(c => ({
      id: c.id, type: 'Certificate', ref: c.certificate_number || `CERT-${c.id.slice(0, 8)}`, client: c.clients?.company_name, amount: c.amount || 0, status: c.status || 'Issued', date: c.created_at
    })) || []),
    ...(posRes.data?.filter(p => p.clients !== null).map(p => ({
      id: p.id, type: 'Purchase Order', ref: p.po_number || `PO-${p.id.slice(0, 8)}`, client: p.clients?.company_name, amount: p.total || 0, status: p.status || 'Draft', date: p.created_at
    })) || []),
    ...(creditNotesRes.data?.filter(cn => cn.clients !== null).map(cn => ({
      id: cn.id, type: 'Credit Note', ref: cn.credit_note_number || `CN-${cn.id.slice(0, 8)}`, client: cn.clients?.company_name, amount: cn.total || 0, status: cn.status || 'Draft', date: cn.created_at
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return <ActivityClient activities={activities} />;
}
