import { createClient } from '@/lib/supabase/server';
import { format, startOfMonth, endOfMonth, parseISO, addDays, isToday, isTomorrow, differenceInDays } from 'date-fns';
import {
  Receipt,
  AlertCircle,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Plus,
  Users,
  Wallet,
  TrendingDown,
  CheckSquare,
  Phone,
  FileText,
  MessageSquare,
  ChevronRight,
  Bell,
  Check,
  X,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import WelcomeBanner from '@/components/office/WelcomeBanner';
import DashboardSummaryCards from '@/components/office/DashboardSummaryCards';
import RecentActivitySection from '@/components/office/RecentActivitySection';
import DashboardGreeting from '@/components/office/DashboardGreeting';
import { getTaskStats, getTasks } from '@/lib/tasks/actions';
import { getCalendarEvents } from '@/lib/calendar/actions';
import { getNotes } from '@/lib/notes/actions';
import { getUpcomingReminders } from '@/lib/reminders/actions';
import QuickCompleteTask from '@/components/office/QuickCompleteTask';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { getWhatsAppPaymentReminderMessage } from '@/lib/whatsapp/utils';

const formatRand = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
  const yesterday = format(addDays(now, -1), 'yyyy-MM-dd');
  const nextWeek = format(addDays(now, 7), 'yyyy-MM-dd');
  const in3days = format(addDays(now, 3), 'yyyy-MM-dd');
  const firstDayOfMonth = format(startOfMonth(now), 'yyyy-MM-dd');
  const lastDayOfMonth = format(endOfMonth(now), 'yyyy-MM-dd');

  // Get user info
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] || 'there';

  // Fetch all data in parallel
  const [
    profile,
    taskStats,
    todayTasks,
    overdueTasks,
    todayEvents,
    pendingFollowUps,
    overdueInvoices,
    quotesPending,
    expensesThisMonth,
    collectedThisMonth,
    recentActivity,
  ] = await Promise.all([
    // User profile
    supabase.from('business_profile').select('*').single(),

    // Task stats
    getTaskStats(),

    // Tasks due today (not done, not cancelled)
    getTasks({ status: 'todo' }),

    // Overdue tasks
    getTasks({ status: 'todo', dueBefore: today }),

    // Calendar events for today
    getCalendarEvents(today, today),

    // Notes with pending follow-ups (due today, overdue, or in next 3 days)
    getNotes({ followUpPending: true, limit: 20 }),

    // Overdue invoices
    supabase
      .from('invoices')
      .select('id, invoice_number, balance_due, due_date, clients(company_name)')
      .in('status', ['Sent', 'Overdue', 'Partially Paid'])
      .lt('due_date', today)
      .gt('balance_due', 0)
      .order('due_date', { ascending: true }),

    // Quotes pending (Sent status)
    supabase
      .from('quotes')
      .select('id, quote_number, total, clients(company_name)')
      .eq('status', 'Sent')
      .order('created_at', { ascending: false }),

    // Expenses this month
    supabase
      .from('expenses')
      .select('amount_inclusive')
      .gte('expense_date', firstDayOfMonth)
      .lte('expense_date', lastDayOfMonth)
      .then(({ data }) => data || []),

    // Collected this month (payments)
    supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', firstDayOfMonth)
      .lte('payment_date', lastDayOfMonth)
      .then(({ data }) => data || []),

    // Recent activity (last 48 hours)
    Promise.all([
      supabase.from('quotes').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(3),
      supabase.from('invoices').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(3),
      supabase.from('payments').select('*, invoices(invoice_number, clients(company_name))').order('created_at', { ascending: false }).limit(3),
      supabase.from('tasks').select('*, client:clients(company_name)').order('updated_at', { ascending: false }).limit(3),
      supabase.from('notes').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(3),
    ]),
  ]);

  // Filter today's events
  const eventsForToday = (todayEvents.data || []).filter((e: any) => e.start_date === today);

  // Filter tasks due today
  const tasksDueToday = (todayTasks || []).filter((t: any) => t.due_date === today);
  const tasksOverdue = (overdueTasks || []).filter((t: any) => t.due_date && t.due_date < today && t.status !== 'done');

  // Filter pending follow-ups (due within next 3 days)
  const urgentFollowUps = (pendingFollowUps || []).filter((n: any) => {
    if (!n.follow_up_required || n.follow_up_completed) return false;
    const followUpDate = n.follow_up_date;
    if (!followUpDate) return true; // No date = show anyway
    return followUpDate <= in3days;
  });

  // Overdue invoices data
  const overdueInvoiceData = overdueInvoices.data || [];
  const overdueInvoiceCount = overdueInvoiceData.length;
  const overdueInvoiceValue = overdueInvoiceData.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

  // Quotes pending
  const quotesPendingData = quotesPending.data || [];
  const quotesPendingCount = quotesPendingData.length;
  const quotesPendingValue = quotesPendingData.reduce((sum, q) => sum + (q.total || 0), 0);

  // Expenses this month
  const expensesValue = Array.isArray(expensesThisMonth)
    ? expensesThisMonth.reduce((sum: number, e: any) => sum + (e.amount_inclusive || 0), 0)
    : 0;

  // Collected this month
  const collectedValue = Array.isArray(collectedThisMonth)
    ? collectedThisMonth.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    : 0;

  // Build recent activity
  const [quotesRes, invoicesRes, paymentsRes, tasksRes, notesRes] = recentActivity;
  const activities = [
    ...(quotesRes.data?.map(q => ({ id: q.id, type: 'Quote', ref: q.quote_number, client: q.clients?.company_name, amount: q.total, status: q.status, date: q.created_at })) || []),
    ...(invoicesRes.data?.map(i => ({ id: i.id, type: 'Invoice', ref: i.invoice_number, client: i.clients?.company_name, amount: i.total, status: i.status, date: i.created_at })) || []),
    ...(paymentsRes.data?.filter(p => p.invoices?.clients).map(p => ({ id: p.id, type: 'Payment', ref: p.invoices?.invoice_number, client: p.invoices?.clients?.company_name, amount: p.amount, status: 'Success', date: p.created_at })) || []),
    ...(tasksRes.data?.map(t => ({ id: t.id, type: 'Task', ref: t.title, client: t.client?.company_name, amount: null, status: t.status, date: t.updated_at })) || []),
    ...(notesRes.data?.map(n => ({ id: n.id, type: 'Note', ref: n.title || n.content.slice(0, 30), client: n.clients?.company_name, amount: null, status: n.note_type, date: n.created_at })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // Get invoice stats for summary cards
  const { data: outstandingSummary } = await supabase
    .from('client_outstanding_summary')
    .select('invoice_balance, total_outstanding');

  const outstandingValue = outstandingSummary?.reduce((sum, c) => sum + (c.total_outstanding || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Section 1: Welcome Banner with Date/Time */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {format(now, 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/office/chat"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          >
            <MessageSquare size={18} />
            Ask AI Assistant
          </Link>
        </div>
      </div>

      {/* AI Morning Briefing - if not dismissed */}
      {/* <AiMorningBriefing /> */}

      {/* Section 2: Today's Schedule - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Calendar - Today's Events */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar size={16} className="text-orange-500" />
              Today&apos;s Schedule
            </h2>
            <Link href="/office/calendar" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
              View full calendar <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {eventsForToday.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No events scheduled for today.</p>
            ) : (
              eventsForToday.map((event: any) => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-center min-w-[50px]">
                    <span className="text-sm font-bold text-orange-500">
                      {event.start_time ? event.start_time.slice(0, 5) : 'All Day'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{event.title}</p>
                    {event.location && (
                      <p className="text-xs text-slate-400 truncate">{event.location}</p>
                    )}
                    {event.client_id && (
                      <p className="text-xs text-slate-500">Client event</p>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${event.event_type === 'site_visit' ? 'bg-blue-500/20 text-blue-400' :
                      event.event_type === 'meeting' ? 'bg-purple-500/20 text-purple-400' :
                        event.event_type === 'deadline' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-700 text-slate-400'
                    }`}>
                    {event.event_type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Tasks Due Today */}
        <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <CheckSquare size={16} className="text-orange-500" />
              Tasks Due Today
            </h2>
            <Link href="/office/tasks" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
              View all tasks <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Overdue tasks first */}
            {tasksOverdue.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  OVERDUE ({tasksOverdue.length})
                </p>
                {tasksOverdue.slice(0, 3).map((task: any) => (
                  <QuickCompleteTask key={task.id} task={task} />
                ))}
              </div>
            )}

            {/* Due today tasks */}
            {tasksDueToday.length === 0 && tasksOverdue.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No tasks due today. Great job!</p>
            ) : (
              tasksDueToday.slice(0, 5).map((task: any) => (
                <QuickCompleteTask key={task.id} task={task} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue This Month */}
        <Link href="/office/invoices?range=this-month" className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5 hover:border-orange-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Revenue This Month</p>
              <h3 className="text-2xl font-black text-green-500">{formatRand(collectedValue)}</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp size={20} className="text-green-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Collected from payments</p>
        </Link>

        {/* Outstanding Invoices */}
        <Link href="/office/invoices?status=sent" className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5 hover:border-orange-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Outstanding</p>
              <h3 className="text-2xl font-black text-white">{formatRand(outstandingValue)}</h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Receipt size={20} className="text-orange-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Total outstanding invoices</p>
        </Link>

        {/* Overdue Invoices */}
        <Link href="/office/invoices?status=overdue" className="bg-[#151B28] border border-red-500/30 rounded-xl p-5 hover:border-red-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Overdue</p>
              <h3 className="text-2xl font-black text-red-500">{formatRand(overdueInvoiceValue)}</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle size={20} className="text-red-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{overdueInvoiceCount} overdue invoice{overdueInvoiceCount !== 1 ? 's' : ''}</p>
        </Link>

        {/* Quotes Pending */}
        <Link href="/office/quotes?status=sent" className="bg-[#151B28] border border-slate-800/50 rounded-xl p-5 hover:border-orange-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Quotes Pending</p>
              <h3 className="text-2xl font-black text-white">{formatRand(quotesPendingValue)}</h3>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <FileText size={20} className="text-cyan-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{quotesPendingCount} quote{quotesPendingCount !== 1 ? 's' : ''} awaiting response</p>
        </Link>
      </div>

      {/* Section 4: Pending Follow-ups */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Bell size={16} className="text-orange-500" />
            Pending Follow-ups
          </h2>
          <Link href="/office/notes" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
            View all notes <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="space-y-2">
          {urgentFollowUps.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No pending follow-ups. All caught up!</p>
          ) : (
            urgentFollowUps.slice(0, 5).map((note: any) => {
              const noteIcon = note.note_type === 'call' ? Phone :
                note.note_type === 'meeting' ? Users :
                  note.note_type === 'site_visit' ? Calendar : FileText;
              const Icon = noteIcon;

              const isOverdue = note.follow_up_date && note.follow_up_date < today;
              const isDueToday = note.follow_up_date === today;
              const isDueTomorrow = note.follow_up_date === tomorrow;

              return (
                <Link
                  key={note.id}
                  href={`/office/notes/${note.id}`}
                  className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-500/20' : isDueToday ? 'bg-orange-500/20' : 'bg-slate-700'}`}>
                    <Icon size={14} className={isOverdue ? 'text-red-400' : isDueToday ? 'text-orange-400' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{note.title || note.content.slice(0, 50)}</p>
                    {note.client && (
                      <p className="text-xs text-slate-400">{note.client.company_name}</p>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${isOverdue ? 'bg-red-500/20 text-red-400' :
                      isDueToday ? 'bg-orange-500/20 text-orange-400' :
                        isDueTomorrow ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-700 text-slate-400'
                    }`}>
                    {isOverdue ? 'Overdue' : isDueToday ? 'Today' : isDueTomorrow ? 'Tomorrow' : note.follow_up_date ? format(parseISO(note.follow_up_date), 'MMM d') : 'No date'}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Section 5: Overdue Invoices Alert - Only show if there are overdue invoices */}
      {overdueInvoiceCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
              <AlertCircle size={16} />
              {overdueInvoiceCount} Overdue Invoice{overdueInvoiceCount !== 1 ? 's' : ''} — {formatRand(overdueInvoiceValue)}
            </h2>
            <Link href="/office/invoices?status=Overdue" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-red-500/20">
                  <th className="text-left py-2 font-medium">Invoice</th>
                  <th className="text-left py-2 font-medium">Client</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-right py-2 font-medium">Days Overdue</th>
                  <th className="text-right py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoiceData.slice(0, 5).map((inv: any) => {
                  const daysOverdue = differenceInDays(parseISO(today), parseISO(inv.due_date));
                  return (
                    <tr key={inv.id} className="border-b border-red-500/10">
                      <td className="py-3 text-white font-medium">{inv.invoice_number}</td>
                      <td className="py-3 text-slate-400">{inv.clients?.company_name || '-'}</td>
                      <td className="py-3 text-right text-red-400 font-medium">{formatRand(inv.balance_due)}</td>
                      <td className="py-3 text-right text-slate-400">{daysOverdue} days</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.clients?.phone && (
                            <WhatsAppButton
                              phoneNumber={inv.clients.phone}
                              message={getWhatsAppPaymentReminderMessage(
                                inv.clients?.company_name || '',
                                inv.invoice_number,
                                inv.balance_due,
                                daysOverdue
                              )}
                              label="WhatsApp"
                              size="sm"
                              className="!text-[10px]"
                            />
                          )}
                          <button className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded transition-colors">
                            Send Reminder
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 6: Recent Activity Feed */}
      <RecentActivitySection activities={activities} />

      {/* Section 7: AI Assistant Quick Access */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
          <MessageSquare size={16} className="text-orange-500" />
          Quick Access
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/office/ai-assistant"
            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-orange-500/10 hover:border-orange-500/30 border border-transparent transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <MessageSquare size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">AI Assistant</p>
                <p className="text-xs text-slate-400">Ask anything about your business</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-orange-500" />
          </Link>

          <Link
            href="/office/tasks"
            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-orange-500/10 hover:border-orange-500/30 border border-transparent transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Plus size={18} className="text-green-500" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">Create Task</p>
                <p className="text-xs text-slate-400">Add a new to-do item</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-orange-500" />
          </Link>

          <Link
            href="/office/notes"
            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-orange-500/10 hover:border-orange-500/30 border border-transparent transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">Add Note</p>
                <p className="text-xs text-slate-400">Quick note or call log</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-orange-500" />
          </Link>
        </div>
      </div>

      {/* Keep existing summary cards for backward compatibility */}
      <DashboardSummaryCards
        initialPreferences={profile.data?.document_settings?.notification_preferences || null}
        dailySummary={{
          outstandingInvoices: outstandingSummary?.filter(c => c.total_outstanding > 0).length || 0,
          quotesExpiringSoon: 0,
          daysToVat: null,
        }}
      />
    </div>
  );
}