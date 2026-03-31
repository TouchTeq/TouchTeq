'use client';

import { useMemo, useState } from 'react';
import { Bot, Save, Loader2, CheckCircle2, Languages, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { updateBusinessProfile } from '@/lib/settings/actions';

type Props = {
  profile: any;
  setProfile: (profile: any) => void;
};

export default function AiAssistantSettingsTab({ profile, setProfile }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initialDocumentSettings = useMemo(() => profile.document_settings || {}, [profile.document_settings]);
  const initialAi = useMemo(() => initialDocumentSettings.ai_preferences || {}, [initialDocumentSettings.ai_preferences]);
  const initialNotifications = useMemo(() => initialDocumentSettings.notification_preferences || {}, [initialDocumentSettings.notification_preferences]);

  const [requireConfirmation, setRequireConfirmation] = useState(initialAi.require_confirmation_before_send !== false);
  const [conciseResponses, setConciseResponses] = useState(initialAi.concise_responses !== false);
  const [languagePreference, setLanguagePreference] = useState(initialAi.language_preference === 'british_english' ? 'british_english' : 'south_african_english');
  const [handsFreeMode, setHandsFreeMode] = useState(initialAi.hands_free_mode !== false);

  const [cronJobSummaryNotification, setCronJobSummaryNotification] = useState(initialNotifications.cron_job_summary_notification !== false);
  const [dailyActionSummary, setDailyActionSummary] = useState(initialNotifications.daily_action_summary !== false);

  const toggleClass = (enabled: boolean) =>
    `h-5 w-10 rounded-full transition-all ${enabled ? 'bg-orange-500' : 'bg-slate-700'}`;

  const knobClass = (enabled: boolean) =>
    `block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`;

  const handleSave = async () => {
    setSaving(true);

    const nextProfile = {
      ...profile,
      document_settings: {
        ...(profile.document_settings || {}),
        ai_preferences: {
          ...(profile.document_settings?.ai_preferences || {}),
          require_confirmation_before_send: requireConfirmation,
          concise_responses: conciseResponses,
          language_preference: languagePreference,
          hands_free_mode: handsFreeMode,
        },
        notification_preferences: {
          ...(profile.document_settings?.notification_preferences || {}),
          cron_job_summary_notification: cronJobSummaryNotification,
          daily_action_summary: dailyActionSummary,
        },
      },
    };

    const result = await updateBusinessProfile(nextProfile);
    if (result.success) {
      setProfile(nextProfile);
      window.localStorage.setItem(
        'touchteq_assistant_settings',
        JSON.stringify({
          document_settings: nextProfile.document_settings,
          email_settings: nextProfile.email_settings,
        })
      );
      window.dispatchEvent(new Event('touchteq-settings-change'));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }

    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Bot size={18} className="text-orange-500" />
          <h3 className="text-white font-black uppercase tracking-[0.15em] text-sm">Conversation Behaviour</h3>
        </div>

        <ToggleRow
          label="Require confirmation before sending"
          description="When enabled, the AI confirms before executing send actions."
          enabled={requireConfirmation}
          onToggle={() => setRequireConfirmation((prev) => !prev)}
          toggleClass={toggleClass}
          knobClass={knobClass}
        />
        <ToggleRow
          label="Concise responses"
          description="When enabled, responses are limited to 3 sentences."
          enabled={conciseResponses}
          onToggle={() => setConciseResponses((prev) => !prev)}
          toggleClass={toggleClass}
          knobClass={knobClass}
        />
        <ToggleRow
          label="Hands-free mode"
          description="When enabled, the microphone auto-reactivates after AI replies."
          enabled={handsFreeMode}
          onToggle={() => setHandsFreeMode((prev) => !prev)}
          toggleClass={toggleClass}
          knobClass={knobClass}
        />

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Languages size={12} /> Language Preference
          </label>
          <select
            value={languagePreference}
            onChange={(e) => setLanguagePreference(e.target.value as 'south_african_english' | 'british_english')}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-orange-500 outline-none"
          >
            <option value="south_african_english">South African English</option>
            <option value="british_english">British English</option>
          </select>
        </div>
      </section>

      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-orange-500" />
          <h3 className="text-white font-black uppercase tracking-[0.15em] text-sm">Notification Preferences</h3>
        </div>

        <ToggleRow
          label="Cron job summary notification"
          description="Show a dashboard notification after the 06:00 SAST sequence runs."
          enabled={cronJobSummaryNotification}
          onToggle={() => setCronJobSummaryNotification((prev) => !prev)}
          toggleClass={toggleClass}
          knobClass={knobClass}
        />
        <ToggleRow
          label="Daily action summary"
          description="Show a daily dashboard summary card for critical actions."
          enabled={dailyActionSummary}
          onToggle={() => setDailyActionSummary((prev) => !prev)}
          toggleClass={toggleClass}
          knobClass={knobClass}
        />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save AI Settings'}
        </button>
      </div>
    </motion.div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  toggleClass,
  knobClass,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  toggleClass: (enabled: boolean) => string;
  knobClass: (enabled: boolean) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{description}</p>
      </div>
      <button type="button" onClick={onToggle} className={toggleClass(enabled)} aria-pressed={enabled}>
        <span className={knobClass(enabled)} />
      </button>
    </div>
  );
}
