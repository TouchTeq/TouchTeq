'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  X,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  RefreshCcw,
  FileText,
  Package,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

type BriefingItem = {
  id: string;
  icon: React.ElementType;
  label: string;
  detail: string;
  href: string;
  urgency: 'high' | 'medium' | 'low';
};

const DISMISS_KEY = 'touchteq_briefing_dismissed_date';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function addDays(base: string, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function daysBetween(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export default function AiMorningBriefing() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Check if already dismissed today
  useEffect(() => {
    const savedDate = localStorage.getItem(DISMISS_KEY);
    if (savedDate === getTodayString()) {
      setDismissed(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;

    async function fetchBriefing() {
      setLoading(true);
      const today = getTodayString();
      const tomorrow = addDays(today, 1);
      const in7 = addDays(today, 7);
      const in14 = addDays(today, 14);
      const in30 = addDays(today, 30);
      const ago30 = addDays(today, -30);
      const ago7 = addDays(today, -7);
      const collected: BriefingItem[] = [];

      try {
        // 1. Overdue invoices
        const { data: overdueInvoices } = await supabase
          .from('invoices')
          .select('id, invoice_number, balance_due, due_date, clients(company_name)')
          .not('status', 'in', '("Paid","Draft","Cancelled")')
          .lt('due_date', today)
          .order('due_date', { ascending: true })
          .limit(50);

        if (overdueInvoices && overdueInvoices.length > 0) {
          const bucket30 = overdueInvoices.filter(i => daysBetween(i.due_date, today) <= 30);
          const bucket60 = overdueInvoices.filter(i => { const d = daysBetween(i.due_date, today); return d > 30 && d <= 60; });
          const bucket90 = overdueInvoices.filter(i => daysBetween(i.due_date, today) > 60);

          if (bucket90.length > 0) {
            const total = bucket90.reduce((s: number, i: any) => s + Number(i.balance_due || 0), 0);
            collected.push({
              id: 'overdue_90',
              icon: AlertTriangle,
              label: `${bucket90.length} invoice${bucket90.length > 1 ? 's' : ''} 60+ days overdue`,
              detail: `R${total.toLocaleString('en-ZA', { minimumFractionDigits: 0 })} outstanding — urgent`,
              href: '/office/invoices?status=Overdue',
              urgency: 'high',
            });
          }
          if (bucket60.length > 0) {
            const total = bucket60.reduce((s: number, i: any) => s + Number(i.balance_due || 0), 0);
            collected.push({
              id: 'overdue_60',
              icon: AlertTriangle,
              label: `${bucket60.length} invoice${bucket60.length > 1 ? 's' : ''} 31–60 days overdue`,
              detail: `R${total.toLocaleString('en-ZA', { minimumFractionDigits: 0 })} outstanding`,
              href: '/office/invoices?status=Overdue',
              urgency: 'high',
            });
          }
          if (bucket30.length > 0) {
            const total = bucket30.reduce((s: number, i: any) => s + Number(i.balance_due || 0), 0);
            collected.push({
              id: 'overdue_30',
              icon: Clock,
              label: `${bucket30.length} invoice${bucket30.length > 1 ? 's' : ''} up to 30 days overdue`,
              detail: `R${total.toLocaleString('en-ZA', { minimumFractionDigits: 0 })} outstanding`,
              href: '/office/invoices?status=Overdue',
              urgency: 'medium',
            });
          }
        }

        // 2. Quotes expiring within 7 days
        const { data: expiringQuotes } = await supabase
          .from('quotes')
          .select('id, quote_number, expiry_date, clients(company_name)')
          .not('status', 'in', '("Accepted","Declined","Rejected","Expired","Converted")')
          .gte('expiry_date', today)
          .lte('expiry_date', in7)
          .order('expiry_date', { ascending: true })
          .limit(20);

        if (expiringQuotes && expiringQuotes.length > 0) {
          const names = expiringQuotes
            .slice(0, 2)
            .map((q: any) => q.clients?.company_name || q.quote_number)
            .join(', ');
          collected.push({
            id: 'quotes_expiring',
            icon: FileText,
            label: `${expiringQuotes.length} quote${expiringQuotes.length > 1 ? 's' : ''} expiring within 7 days`,
            detail: names + (expiringQuotes.length > 2 ? ` +${expiringQuotes.length - 2} more` : ''),
            href: '/office/quotes',
            urgency: 'medium',
          });
        }

        // 3. VAT due within 14 days
        const { data: vatPeriods } = await supabase
          .from('vat_periods')
          .select('id, period_end, due_date, status')
          .eq('status', 'Open')
          .lte('due_date', in14)
          .gte('due_date', today)
          .order('due_date', { ascending: true })
          .limit(3);

        if (vatPeriods && vatPeriods.length > 0) {
          const next = vatPeriods[0];
          const daysLeft = daysBetween(today, next.due_date);
          collected.push({
            id: 'vat_due',
            icon: Calendar,
            label: `VAT submission due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            detail: `Due ${next.due_date} — period ending ${next.period_end}`,
            href: '/office/vat',
            urgency: daysLeft <= 7 ? 'high' : 'medium',
          });
        }

        // 4. Clients not contacted in 30+ days with outstanding balance
        const { data: clientsWithBalance } = await supabase
          .from('clients')
          .select('id, company_name, last_contact_at')
          .eq('is_active', true)
          .or(`last_contact_at.lt.${ago30},last_contact_at.is.null`)
          .limit(100);

        if (clientsWithBalance && clientsWithBalance.length > 0) {
          // Filter those with outstanding invoices
          const { data: outstandingClients } = await supabase
            .from('invoices')
            .select('client_id')
            .not('status', 'in', '("Paid","Draft","Cancelled")')
            .gt('balance_due', 0)
            .in('client_id', clientsWithBalance.map((c: any) => c.id));

          const overduClientIds = new Set((outstandingClients || []).map((i: any) => i.client_id));
          const stale = clientsWithBalance.filter((c: any) => overduClientIds.has(c.id));

          if (stale.length > 0) {
            const names = stale.slice(0, 2).map((c: any) => c.company_name).join(', ');
            collected.push({
              id: 'stale_clients',
              icon: Users,
              label: `${stale.length} client${stale.length > 1 ? 's' : ''} not contacted in 30+ days`,
              detail: names + (stale.length > 2 ? ` +${stale.length - 2} more — have outstanding balances` : ' — has outstanding balance'),
              href: '/office/clients',
              urgency: 'low',
            });
          }
        }

        // 5. Recurring invoices due today or tomorrow
        const { data: recurringDue } = await supabase
          .from('invoices')
          .select('id, invoice_number, recurring_next_date, clients(company_name)')
          .eq('is_recurring', true)
          .lte('recurring_next_date', tomorrow)
          .gte('recurring_next_date', today)
          .limit(10);

        if (recurringDue && recurringDue.length > 0) {
          const names = recurringDue
            .slice(0, 2)
            .map((i: any) => i.clients?.company_name || i.invoice_number)
            .join(', ');
          collected.push({
            id: 'recurring_due',
            icon: RefreshCcw,
            label: `${recurringDue.length} recurring invoice${recurringDue.length > 1 ? 's' : ''} due today or tomorrow`,
            detail: names + (recurringDue.length > 2 ? ` +${recurringDue.length - 2} more` : ''),
            href: '/office/invoices',
            urgency: 'medium',
          });
        }

        // 6. Certificates expiring within 30 days
        const { data: expCerts } = await supabase
          .from('certificates')
          .select('id, certificate_number, next_inspection_date, clients(company_name)')
          .eq('status', 'Issued')
          .gte('next_inspection_date', today)
          .lte('next_inspection_date', in30)
          .order('next_inspection_date', { ascending: true })
          .limit(10);

        if (expCerts && expCerts.length > 0) {
          const names = expCerts
            .slice(0, 2)
            .map((c: any) => c.clients?.company_name || c.certificate_number)
            .join(', ');
          collected.push({
            id: 'certs_expiring',
            icon: FileText,
            label: `${expCerts.length} certificate${expCerts.length > 1 ? 's' : ''} due for re-inspection within 30 days`,
            detail: names + (expCerts.length > 2 ? ` +${expCerts.length - 2} more` : ''),
            href: '/office/certificates',
            urgency: 'low',
          });
        }

        // 7. Purchase orders not acknowledged after 7 days
        const { data: stalePOs } = await supabase
          .from('purchase_orders')
          .select('id, po_number, date_raised, supplier_name')
          .in('status', ['Draft', 'Sent'])
          .lte('date_raised', ago7)
          .order('date_raised', { ascending: true })
          .limit(10);

        if (stalePOs && stalePOs.length > 0) {
          const names = stalePOs.slice(0, 2).map((p: any) => p.supplier_name).join(', ');
          collected.push({
            id: 'stale_pos',
            icon: Package,
            label: `${stalePOs.length} purchase order${stalePOs.length > 1 ? 's' : ''} not acknowledged after 7 days`,
            detail: names + (stalePOs.length > 2 ? ` +${stalePOs.length - 2} more` : ''),
            href: '/office/purchase-orders',
            urgency: 'low',
          });
        }
      } catch (e) {
        // fail silently — briefing is best-effort
      }

      setItems(collected);
      setLoading(false);
    }

    void fetchBriefing();
  }, [dismissed, supabase]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, getTodayString());
    setDismissed(true);
  };

  if (dismissed || loading) {
    return loading && !dismissed ? (
      <div className="mb-6 flex items-center justify-center gap-2 text-slate-600 text-xs">
        <Loader2 size={12} className="animate-spin" />
        <span>Checking your business data...</span>
      </div>
    ) : null;
  }

  const urgencyColor = (u: BriefingItem['urgency']) => {
    if (u === 'high') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (u === 'medium') return 'text-orange-300 bg-orange-500/10 border-orange-500/20';
    return 'text-slate-400 bg-slate-800/50 border-slate-700/50';
  };

  const iconColor = (u: BriefingItem['urgency']) => {
    if (u === 'high') return 'text-red-400';
    if (u === 'medium') return 'text-orange-400';
    return 'text-slate-500';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-5xl mx-auto mb-8"
      >
        <div className="rounded-2xl border border-slate-700/60 bg-[#0D1220]/90 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
                {items.length > 0 ? "Here's what needs your attention today" : "All clear"}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <X size={11} />
              Dismiss
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {items.length === 0 ? (
              <div className="flex items-center gap-3 py-2 px-1">
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                <p className="text-sm font-medium text-slate-300">
                  All clear — no urgent items today. Good time to focus on new business.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => router.push(item.href)}
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all hover:brightness-110 active:scale-[0.99] ${urgencyColor(item.urgency)}`}
                    >
                      <Icon size={15} className={`mt-0.5 shrink-0 ${iconColor(item.urgency)}`} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold leading-snug">{item.label}</p>
                        <p className="mt-0.5 text-[11px] font-medium leading-snug opacity-70 truncate">{item.detail}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
