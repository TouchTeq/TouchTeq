import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditInvoiceClient from './EditInvoiceClient';

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', id)
    .single();

  if (!invoice) notFound();

  // 2. Fetch Line Items
  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order', { ascending: true });

  // 3. Fetch all active clients for potential change (though normally we keep client same in edit)
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('company_name');

  return (
    <div className="space-y-8">
      <EditInvoiceClient 
        initialInvoice={invoice} 
        initialLineItems={lineItems || []} 
        initialClients={clients || []} 
      />
    </div>
  );
}
