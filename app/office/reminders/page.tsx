import { createClient } from '@/lib/supabase/server';
import RemindersClient from './RemindersClient';

export default async function RemindersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  let reminders: any[] = [];
  let stats = { total: 0, pending: 0, overdue: 0, completed: 0 };
  let overdueInvoices: any[] = [];
  let history: any[] = [];

  if (user) {
    const now = new Date().toISOString();
    
    const { data: remindersData } = await supabase
      .from('reminders')
      .select('*, client:clients(company_name)')
      .eq('user_id', user.id)
      .order('reminder_at', { ascending: true })
      .limit(50);
    
    reminders = remindersData || [];
    
    const allReminders = reminders;
    stats = {
      total: allReminders.length,
      pending: allReminders.filter(r => r.status === 'pending').length,
      overdue: allReminders.filter(r => r.status === 'pending' && r.reminder_at < now).length,
      completed: allReminders.filter(r => r.status === 'completed').length,
    };
    
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*, clients(company_name, email, contact_person)')
      .eq('status', 'Overdue')
      .order('due_date', { ascending: true })
      .limit(10);
    
    overdueInvoices = invoicesData?.filter(inv => inv.clients !== null) || [];
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { data: historyData } = await supabase
      .from('reminder_logs')
      .select('*, invoices(invoice_number, client_id, clients(company_name))')
      .gte('sent_at', startOfMonth.toISOString())
      .order('sent_at', { ascending: false })
      .limit(20);
    
    history = historyData || [];
  }

  return (
    <RemindersClient
      reminders={reminders}
      stats={stats}
      overdueInvoices={overdueInvoices}
      history={history}
    />
  );
}