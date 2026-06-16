import { createClient } from '@/lib/supabase/server';
import SalesOrderForm from '../SalesOrderForm';

export default async function NewSalesOrderPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .order('company_name', { ascending: true });

  return <SalesOrderForm clients={clients ?? []} mode="new" />;
}
