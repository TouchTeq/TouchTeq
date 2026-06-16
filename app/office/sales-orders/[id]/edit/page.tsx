import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSalesOrder } from '@/lib/sales-orders/actions';
import SalesOrderForm from '../../SalesOrderForm';

export default async function EditSalesOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: clients }, soRes] = await Promise.all([
    supabase.from('clients').select('id, company_name').order('company_name', { ascending: true }),
    getSalesOrder(id),
  ]);
  if ('error' in soRes || !soRes.data) notFound();

  return <SalesOrderForm clients={clients ?? []} mode="edit" salesOrderId={id} initial={soRes.data} />;
}
