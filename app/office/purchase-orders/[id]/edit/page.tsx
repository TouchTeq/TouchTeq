import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditPurchaseOrderClient from './EditPurchaseOrderClient';

export default async function EditPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .eq('id', id)
    .single();

  if (error || !po) {
    notFound();
  }

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, clients(company_name)')
    .in('status', ['Accepted'])
    .order('created_at', { ascending: false });

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, clients(company_name)')
    .eq('status', 'Paid')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <EditPurchaseOrderClient initialPO={po} quotes={quotes || []} invoices={invoices || []} />
    </div>
  );
}
