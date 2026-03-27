import { createClient } from '@/lib/supabase/server';
import VatClient from './VatClient';

export default async function VatPage() {
  const supabase = await createClient();

  // Fetch all VAT periods sorted by date
  const { data: periods } = await supabase
    .from('vat_periods')
    .select('*')
    .order('period_start', { ascending: false });

  // Find the open period to fetch details for reports/summary
  const openPeriod = periods?.find(p => p.status === 'Open') || periods?.[0];

  let currentInvoices: any[] = [];
  let currentExpenses: any[] = [];

  if (openPeriod) {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, clients(company_name, contact_person)')
      .gte('issue_date', openPeriod.period_start)
      .lte('issue_date', openPeriod.period_end);
    
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('vat_claimable', true)
      .gte('expense_date', openPeriod.period_start)
      .lte('expense_date', openPeriod.period_end);

    currentInvoices = invoices || [];
    currentExpenses = expenses || [];
  }

  // Fetch business profile
  const { data: profile } = await supabase
    .from('business_profile')
    .select('*')
    .single();

  return (
    <div className="py-8">
      <VatClient 
        periods={periods || []} 
        currentInvoices={currentInvoices}
        currentExpenses={currentExpenses}
        businessProfile={profile}
      />
    </div>
  );
}
