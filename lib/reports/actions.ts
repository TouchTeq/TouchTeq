'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  startOfMonth, 
  endOfMonth, 
  format, 
  startOfYear, 
  endOfYear, 
  differenceInDays, 
  parseISO,
  subMonths,
  addMonths,
  eachMonthOfInterval,
  isWithinInterval,
  startOfQuarter,
  endOfQuarter
} from 'date-fns';

export async function getMonthlyRevenueReport(year: number) {
  const supabase = await createClient();
  
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Fetch all invoices for the year
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total, issue_date, status')
    .gte('issue_date', startDate)
    .lte('issue_date', endDate)
    .neq('status', 'Draft');

  // Fetch all payments for the year
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate);

  const months = eachMonthOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31)
  });

  const chartData = months.map(month => {
    const monthStr = format(month, 'yyyy-MM');
    const monthInvoices = invoices?.filter(inv => inv.issue_date.startsWith(monthStr)) || [];
    const monthPayments = payments?.filter(pay => pay.payment_date.startsWith(monthStr)) || [];

    const invoiced = monthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const collected = monthPayments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const outstanding = invoiced - collected;
    const collectionRate = invoiced > 0 ? (collected / invoiced) * 100 : 0;

    return {
      month: format(month, 'MMM'),
      fullMonth: format(month, 'MMMM'),
      invoiced,
      collected,
      outstanding,
      collectionRate
    };
  });

  return chartData;
}

export async function getSingleMonthRevenueReport(year: number, month: number) {
  const supabase = await createClient();
  const dateStr = `${year}-${String(month).padStart(2, '0')}`;
  const startDate = `${dateStr}-01`;
  const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

  // Fetch invoices for the month
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(company_name)')
    .gte('issue_date', startDate)
    .lte('issue_date', endDate)
    .neq('status', 'Draft');

  // Fetch payments for the month
  const { data: payments } = await supabase
    .from('payments')
    .select('*, invoices(invoice_number, clients(company_name))')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate);

  // Group invoices by client
  const clientBreakdown: Record<string, any> = {};
  invoices?.forEach(inv => {
    const name = inv.clients?.company_name || 'Unknown';
    if (!clientBreakdown[name]) clientBreakdown[name] = { name, invoiced: 0, collected: 0 };
    clientBreakdown[name].invoiced += Number(inv.total);
  });

  payments?.forEach(pay => {
    const name = pay.invoices?.clients?.company_name || 'Unknown';
    if (!clientBreakdown[name]) clientBreakdown[name] = { name, invoiced: 0, collected: 0 };
    clientBreakdown[name].collected += Number(pay.amount);
  });

  return {
    totals: {
      invoiced: invoices?.reduce((s, i) => s + Number(i.total), 0) || 0,
      collected: payments?.reduce((s, p) => s + Number(p.amount), 0) || 0,
    },
    clientBreakdown: Object.values(clientBreakdown),
    invoices: invoices || [],
    payments: payments || []
  };
}

export async function getClientRevenueReport(dateRange: string) {
  const supabase = await createClient();
  
  let startDate: string | null = null;
  const now = new Date();

  switch(dateRange) {
    case 'This Month': startDate = format(startOfMonth(now), 'yyyy-MM-dd'); break;
    case 'Last Month': startDate = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'); break;
    case 'This Quarter': startDate = format(startOfQuarter(now), 'yyyy-MM-dd'); break;
    case 'This Year': startDate = format(startOfYear(now), 'yyyy-MM-dd'); break;
    case 'All Time': startDate = '2000-01-01'; break;
  }

  const { data: clientInvoices } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .gte('issue_date', startDate!)
    .neq('status', 'Draft');

  const clientStats: Record<string, any> = {};

  clientInvoices?.forEach(inv => {
    const cid = inv.client_id;
    if (!clientStats[cid]) {
      clientStats[cid] = {
        clientId: cid,
        clientName: inv.clients?.company_name || 'Individual',
        totalInvoiced: 0,
        totalCollected: 0,
        outstandingBalance: 0,
        invoiceCount: 0,
        avgInvoiceValue: 0
      };
    }
    clientStats[cid].totalInvoiced += Number(inv.total);
    clientStats[cid].totalCollected += Number(inv.amount_paid);
    clientStats[cid].outstandingBalance += Number(inv.balance_due);
    clientStats[cid].invoiceCount += 1;
  });

  const reportData = Object.values(clientStats)
    .map(stat => ({
      ...stat,
      avgInvoiceValue: stat.totalInvoiced / stat.invoiceCount
    }))
    .sort((a, b) => b.totalInvoiced - a.totalInvoiced);

  return reportData;
}

export async function getDebtorsReport() {
  const supabase = await createClient();
  const now = new Date();

  // Get all unpaid invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .gt('balance_due', 0)
    .neq('status', 'Draft');

  const ageing: Record<string, any> = {};
  
  invoices?.forEach(inv => {
    const cid = inv.client_id;
    if (!ageing[cid]) {
      ageing[cid] = {
        clientName: inv.clients?.company_name,
        clientId: cid,
        current: 0,
        age30: 0,
        age60: 0,
        age90: 0,
        agePlus: 0,
        total: 0
      };
    }

    const dueDate = parseISO(inv.due_date);
    const balance = Number(inv.balance_due);
    const daysOverdue = differenceInDays(now, dueDate);

    ageing[cid].total += balance;
    
    if (daysOverdue <= 0) {
      ageing[cid].current += balance;
    } else if (daysOverdue <= 30) {
      ageing[cid].age30 += balance;
    } else if (daysOverdue <= 60) {
      ageing[cid].age60 += balance;
    } else if (daysOverdue <= 90) {
      ageing[cid].age90 += balance;
    } else {
      ageing[cid].agePlus += balance;
    }
  });

  const detailedInvoices = invoices?.map(inv => ({
    ...inv,
    daysOverdue: differenceInDays(now, parseISO(inv.due_date))
  })).sort((a, b) => b.daysOverdue - a.daysOverdue) || [];

  return {
    ageing: Object.values(ageing).sort((a, b) => b.total - a.total),
    details: detailedInvoices
  };
}

export async function getExpenseReport(dateRange: string, category: string = 'All') {
  const supabase = await createClient();
  const now = new Date();
  let startDate: string | null = null;

  switch(dateRange) {
    case 'This Month': startDate = format(startOfMonth(now), 'yyyy-MM-dd'); break;
    case 'Last Month': startDate = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'); break;
    case 'This Quarter': startDate = format(startOfQuarter(now), 'yyyy-MM-dd'); break;
    case 'This Year': startDate = format(startOfYear(now), 'yyyy-MM-dd'); break;
    case 'All Time': startDate = '2000-01-01'; break;
  }

  let query = supabase.from('expenses').select('*').gte('expense_date', startDate!);
  if (category !== 'All') {
    query = query.eq('category', category);
  }

  const { data: expenses } = await query.order('expense_date', { ascending: false });

  const categorySummary: Record<string, any> = {};
  let totalSpent = 0;
  let totalInputVat = 0;

  expenses?.forEach(ex => {
    const cat = ex.category || 'Other';
    if (!categorySummary[cat]) {
      categorySummary[cat] = { category: cat, spent: 0, vat: 0, net: 0, count: 0 };
    }
    categorySummary[cat].spent += Number(ex.amount_inclusive);
    categorySummary[cat].vat += Number(ex.input_vat_amount);
    categorySummary[cat].net += Number(ex.amount_exclusive);
    categorySummary[cat].count += 1;
    
    totalSpent += Number(ex.amount_inclusive);
    totalInputVat += Number(ex.input_vat_amount);
  });

  const summaryData = Object.values(categorySummary).map(cat => ({
    ...cat,
    percentage: totalSpent > 0 ? (cat.spent / totalSpent) * 100 : 0
  })).sort((a, b) => b.spent - a.spent);

  return {
    summary: summaryData,
    totalSpent,
    totalInputVat,
    details: expenses || []
  };
}

export async function getVatHistoryReport() {
  const supabase = await createClient();
  
  const { data: periods } = await supabase
    .from('vat_periods')
    .select('*')
    .order('period_start', { ascending: true });

  const totals = periods?.reduce((acc, p) => {
    acc.output += Number(p.output_vat);
    acc.input += Number(p.input_vat);
    acc.payable += Number(p.net_vat_payable);
    return acc;
  }, { output: 0, input: 0, payable: 0 }) || { output: 0, input: 0, payable: 0 };

  return {
    periods: periods || [],
    totals
  };
}

export async function getAnnualSummary(startYear: number) {
  const supabase = await createClient();
  
  // SA Tax Year: March to February
  const startDate = `${startYear}-03-01`;
  const endDate = `${startYear + 1}-02-28`;

  const { data: invoices } = await supabase.from('invoices').select('total, vat_amount, issue_date').gte('issue_date', startDate).lte('issue_date', endDate).neq('status', 'Draft');
  const { data: payments } = await supabase.from('payments').select('amount, payment_date').gte('payment_date', startDate).lte('payment_date', endDate);
  const { data: expenses } = await supabase.from('expenses').select('amount_exclusive, input_vat_amount, expense_date').gte('expense_date', startDate).lte('expense_date', endDate);

  const months = eachMonthOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });

  const monthlyBreakdown = months.map(m => {
    const mStr = format(m, 'yyyy-MM');
    const rev = invoices?.filter(i => i.issue_date.startsWith(mStr)).reduce((s, i) => s + Number(i.total), 0) || 0;
    const exp = expenses?.filter(e => e.expense_date.startsWith(mStr)).reduce((s, e) => s + Number(e.amount_exclusive), 0) || 0;
    const outVat = invoices?.filter(i => i.issue_date.startsWith(mStr)).reduce((s, i) => s + Number(i.vat_amount), 0) || 0;
    const inVat = expenses?.filter(e => e.expense_date.startsWith(mStr)).reduce((s, e) => s + Number(e.input_vat_amount), 0) || 0;

    return {
      month: format(m, 'MMM yy'),
      revenue: rev,
      expenses: exp,
      net: rev - exp,
      vat: outVat - inVat
    };
  });

  return {
    totalRevenue: invoices?.reduce((s, i) => s + Number(i.total), 0) || 0,
    totalCollected: payments?.reduce((s, p) => s + Number(p.amount), 0) || 0,
    totalExpenses: expenses?.reduce((s, e) => s + Number(e.amount_exclusive), 0) || 0,
    totalOutputVat: invoices?.reduce((s, i) => s + Number(i.vat_amount), 0) || 0,
    totalInputVat: expenses?.reduce((s, e) => s + Number(e.input_vat_amount), 0) || 0,
    monthlyBreakdown
  };
}
