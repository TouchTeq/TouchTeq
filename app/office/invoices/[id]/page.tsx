import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import InvoiceManagement from './InvoiceManagement';

export default async function InvoiceDetailPage({
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

  // 3. Fetch Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', id)
    .order('payment_date', { ascending: false });

  // 4. Fetch Reminder Logs
  const { data: reminderLogs } = await supabase
    .from('reminder_logs')
    .select('*')
    .eq('invoice_id', id)
    .order('sent_at', { ascending: false });

  // 5. Fetch Business Profile
  const { data: profile } = await supabase
    .from('business_profile')
    .select('*')
    .single();

  return (
    <div className="space-y-8">
      <InvoiceManagement 
        invoice={invoice} 
        initialPayments={payments || []} 
        lineItems={lineItems || []} 
        businessProfile={profile} 
        reminderLogs={reminderLogs || []} 
      />
    </div>
  );
}
