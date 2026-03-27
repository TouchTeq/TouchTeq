'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear, 
  format,
  parseISO
} from 'date-fns';

export type StatementLogEntry = {
  date: string;
  ref: string;
  desc: string;
  debit: number;
  credit: number;
  balance: number;
};

export async function getStatementData(clientId: string, range: string, start?: string, end?: string) {
  const supabase = await createClient();
  const now = new Date();
  let startDate: string;
  let endDate: string;

  switch (range) {
    case 'current_month':
      startDate = format(startOfMonth(now), 'yyyy-MM-dd');
      endDate = format(endOfMonth(now), 'yyyy-MM-dd');
      break;
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
      endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
      break;
    case 'current_quarter':
      startDate = format(startOfQuarter(now), 'yyyy-MM-dd');
      endDate = format(endOfQuarter(now), 'yyyy-MM-dd');
      break;
    case 'full_tax_year':
      // SA Tax Year: Mar 1 to Feb 28/29
      const currentYear = now.getFullYear();
      const isPostFeb = now.getMonth() >= 2; // March is month 2
      const taxYearStart = isPostFeb ? currentYear : currentYear - 1;
      startDate = `${taxYearStart}-03-01`;
      endDate = `${taxYearStart + 1}-02-28`;
      break;
    case 'custom':
      startDate = start!;
      endDate = end!;
      break;
    default:
      startDate = format(startOfMonth(now), 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
  }

  // Business Profile Info
  const { data: business } = await supabase.from('business_profile').select('*').single();

  // Client Info
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();

  if (!client) throw new Error('Client not found');

  // Fetch Opening Balance Transactions (everything before startDate)
  // Balance = (sum of prev invoices - sum of prev credits - sum of prev payments) + client.opening_balance
  const { data: prevInvoices } = await supabase.from('invoices').select('total').eq('client_id', clientId).lt('issue_date', startDate).neq('status', 'Draft');
  const { data: prevCredits } = await supabase.from('credit_notes').select('total').eq('client_id', clientId).lt('issue_date', startDate).neq('status', 'Draft');
  
  // For payments, we need to join invoices to filter by client_id
  const { data: prevPayments } = await supabase
    .from('payments')
    .select('amount, invoices!inner(client_id)')
    .eq('invoices.client_id', clientId)
    .lt('payment_date', startDate);

  const prevInvSum = prevInvoices?.reduce((s, i) => s + Number(i.total), 0) || 0;
  const prevCreditSum = prevCredits?.reduce((s, c) => s + Number(c.total), 0) || 0;
  const prevPaymentSum = prevPayments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
  
  const openingBalanceResult = (prevInvSum - prevCreditSum - prevPaymentSum) + Number(client.opening_balance || 0);

  // Fetch Period Transactions
  const { data: periodInvoices } = await supabase.from('invoices').select('*').eq('client_id', clientId).gte('issue_date', startDate).lte('issue_date', endDate).neq('status', 'Draft');
  const { data: periodCredits } = await supabase.from('credit_notes').select('*').eq('client_id', clientId).gte('issue_date', startDate).lte('issue_date', endDate).neq('status', 'Draft');
  const { data: periodPayments } = await supabase
    .from('payments')
    .select('*, invoices!inner(client_id, invoice_number)')
    .eq('invoices.client_id', clientId)
    .gte('payment_date', startDate)
    .lte('payment_date', endDate);

  const transactions: any[] = [];
  
  periodInvoices?.forEach(inv => {
    transactions.push({
      date: inv.issue_date,
      ref: inv.invoice_number,
      desc: 'Invoice',
      debit: Number(inv.total),
      credit: 0
    });
  });

  periodCredits?.forEach(cn => {
    transactions.push({
      date: cn.issue_date,
      ref: cn.credit_note_number,
      desc: `Credit Note: ${cn.reason || 'General'}`,
      debit: 0,
      credit: Number(cn.total)
    });
  });

  periodPayments?.forEach(pay => {
    transactions.push({
      date: pay.payment_date,
      ref: pay.reference || 'EFT PAYMENT',
      desc: `Payment Received (Inv ${pay.invoices?.invoice_number || 'N/A'})`,
      debit: 0,
      credit: Number(pay.amount)
    });
  });

  // Sort by date then type (Invoices first on same day)
  transactions.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA === timeB) {
      if (a.debit > 0 && b.credit > 0) return -1;
      if (a.credit > 0 && b.debit > 0) return 1;
    }
    return timeA - timeB;
  });

  let runningBalance = openingBalanceResult;
  const transactionsWithBalance = transactions.map(t => {
    runningBalance = runningBalance + t.debit - t.credit;
    return { ...t, balance: runningBalance };
  });

  return {
    business,
    client,
    periodStart: startDate,
    periodEnd: endDate,
    openingBalance: openingBalanceResult,
    transactions: transactionsWithBalance,
    closingBalance: runningBalance,
    generatedAt: now.toISOString()
  };
}
