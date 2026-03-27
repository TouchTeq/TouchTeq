import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import VatDetailClient from './VatDetailClient';

export default async function VatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch the period
  const { data: period, error: pError } = await supabase
    .from('vat_periods')
    .select('*')
    .eq('id', id)
    .single();

  if (pError || !period) {
    return notFound();
  }

  // 2. Fetch all invoices in this range
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(company_name, contact_person)')
    .gte('issue_date', period.period_start)
    .lte('issue_date', period.period_end)
    .order('issue_date', { ascending: false });

  // 3. Fetch all claimable expenses in this range
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('vat_claimable', true)
    .gte('expense_date', period.period_start)
    .lte('expense_date', period.period_end)
    .order('expense_date', { ascending: false });

  // 4. Fetch business profile
  const { data: profile } = await supabase
    .from('business_profile')
    .select('*')
    .single();

  return (
    <div className="py-8">
      <VatDetailClient 
        period={period}
        invoices={invoices || []}
        expenses={expenses || []}
        businessProfile={profile}
      />
    </div>
  );
}
