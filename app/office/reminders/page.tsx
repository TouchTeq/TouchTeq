import { createClient } from '@/lib/supabase/server';
import RemindersClient from '@/app/office/reminders/RemindersClient';

export default async function RemindersPage() {
  const supabase = await createClient();

  // 1. Fetch Overdue Invoices for Active Sequence
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select(`
      *,
      clients (company_name, email, contact_person)
    `)
    .eq('status', 'Overdue')
    .order('due_date', { ascending: true });

  // 2. Fetch Reminder History for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: history } = await supabase
    .from('reminder_logs')
    .select(`
      *,
      invoices (invoice_number, client_id, clients (company_name))
    `)
    .gte('sent_at', startOfMonth.toISOString())
    .order('sent_at', { ascending: false });

  // 3. Stats
  const totalOverdueValue = overdueInvoices?.reduce((sum, inv) => sum + Number(inv.balance_due), 0) || 0;
  const remindersSentThisMonth = history?.filter(h => h.status === 'Sent').length || 0;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Reminders</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Automated Payment Chasing</p>
        </div>
      </div>

      <RemindersClient 
        overdueInvoices={overdueInvoices || []} 
        history={history || []}
        stats={{
          totalOverdueCount: overdueInvoices?.length || 0,
          totalOverdueValue,
          remindersSentThisMonth
        }}
      />
    </div>
  );
}
