'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Clock3 } from 'lucide-react';

type NotificationPreferences = {
  cron_job_summary_notification?: boolean;
  daily_action_summary?: boolean;
  cron_last_summary?: {
    ran_at?: string;
    reminders_sent?: number;
    invoices_marked_overdue?: number;
    quotes_expired?: number;
  } | null;
};

type DailySummary = {
  outstandingInvoices: number;
  quotesExpiringSoon: number;
  daysToVat: number | null;
};

type Props = {
  initialPreferences?: NotificationPreferences | null;
  dailySummary: DailySummary;
};

const DEFAULT_PREFERENCES: Required<Omit<NotificationPreferences, 'cron_last_summary'>> = {
  cron_job_summary_notification: true,
  daily_action_summary: true,
};

function normalizePreferences(value?: NotificationPreferences | null) {
  const next: NotificationPreferences = {
    cron_job_summary_notification: value?.cron_job_summary_notification !== false,
    daily_action_summary: value?.daily_action_summary !== false,
    cron_last_summary: value?.cron_last_summary || null,
  };
  return next;
}

export default function DashboardSummaryCards({ initialPreferences, dailySummary }: Props) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    normalizePreferences(initialPreferences)
  );
  const [dismissedDaily, setDismissedDaily] = useState(false);
  const [dismissedCron, setDismissedCron] = useState(false);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const cronKey = useMemo(
    () => preferences.cron_last_summary?.ran_at ? `touchteq_cron_summary_dismissed_${preferences.cron_last_summary.ran_at}` : '',
    [preferences.cron_last_summary?.ran_at]
  );

  useEffect(() => {
    setDismissedDaily(window.localStorage.getItem(`touchteq_daily_summary_dismissed_${todayKey}`) === 'true');
  }, [todayKey]);

  useEffect(() => {
    if (!cronKey) {
      setDismissedCron(false);
      return;
    }
    setDismissedCron(window.localStorage.getItem(cronKey) === 'true');
  }, [cronKey]);

  useEffect(() => {
    const readFromLocalStorage = () => {
      const saved = window.localStorage.getItem('touchteq_assistant_settings');
      if (!saved) {
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        const notificationPreferences = normalizePreferences(parsed?.document_settings?.notification_preferences);
        setPreferences(notificationPreferences);
      } catch {}
    };

    readFromLocalStorage();
    window.addEventListener('touchteq-settings-change', readFromLocalStorage);
    window.addEventListener('storage', readFromLocalStorage);
    return () => {
      window.removeEventListener('touchteq-settings-change', readFromLocalStorage);
      window.removeEventListener('storage', readFromLocalStorage);
    };
  }, []);

  const showDaily = (preferences.daily_action_summary ?? DEFAULT_PREFERENCES.daily_action_summary) && !dismissedDaily;
  const showCron =
    (preferences.cron_job_summary_notification ?? DEFAULT_PREFERENCES.cron_job_summary_notification) &&
    Boolean(preferences.cron_last_summary?.ran_at) &&
    !dismissedCron;

  if (!showDaily && !showCron) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showCron && preferences.cron_last_summary && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">Cron Summary</p>
              <p className="mt-1 text-sm font-bold text-white">
                Reminders sent: {preferences.cron_last_summary.reminders_sent || 0} | Invoices marked overdue: {preferences.cron_last_summary.invoices_marked_overdue || 0} | Quotes expired: {preferences.cron_last_summary.quotes_expired || 0}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (cronKey) {
                  window.localStorage.setItem(cronKey, 'true');
                }
                setDismissedCron(true);
              }}
              className="rounded-lg border border-sky-400/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-200 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showDaily && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                <Bell size={12} /> Daily Action Summary
              </p>
              <p className="text-sm font-bold text-white">Outstanding invoices: {dailySummary.outstandingInvoices}</p>
              <p className="text-sm font-bold text-white">Quotes expiring in 7 days: {dailySummary.quotesExpiringSoon}</p>
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <Clock3 size={14} /> Days until next VAT deadline: {dailySummary.daysToVat ?? 'N/A'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem(`touchteq_daily_summary_dismissed_${todayKey}`, 'true');
                setDismissedDaily(true);
              }}
              className="rounded-lg border border-orange-400/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-200 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
