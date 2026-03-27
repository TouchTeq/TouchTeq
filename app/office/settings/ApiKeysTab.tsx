'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  TestTube2,
  ShieldAlert,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type KeyMeta = {
  key_name: string;
  last_updated_at: string;
};

type AuditEntry = {
  key_name: string;
  action: 'added' | 'updated' | 'removed';
  performed_at: string;
};

type ConnectionStatus = {
  type: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Johannesburg',
  }).format(new Date(iso));
}

function actionLabel(action: string): string {
  if (action === 'added') return 'added';
  if (action === 'updated') return 'updated';
  if (action === 'removed') return 'removed';
  return action;
}

function keyDisplayName(keyName: string): string {
  if (keyName === 'gemini') return 'Gemini API';
  if (keyName === 'brevo') return 'Brevo API';
  return keyName;
}

// ─── Single Key Field Component ───────────────────────────────────────────────

function ApiKeyField({
  id,
  keyName,
  label,
  description,
  linkText,
  linkHref,
  storedMeta,
  onSave,
  onRemove,
}: {
  id: string;
  keyName: string;
  label: string;
  description: string;
  linkText: string;
  linkHref: string;
  storedMeta: KeyMeta | null;
  onSave: (keyName: string, value: string) => Promise<void>;
  onRemove: (keyName: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [connection, setConnection] = useState<ConnectionStatus>({ type: 'idle' });

  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    await onSave(keyName, value);
    setValue('');
    setSaving(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(keyName);
    setRemoving(false);
    setConnection({ type: 'idle' });
  };

  const handleTest = async () => {
    setConnection({ type: 'testing' });
    try {
      const res = await fetch('/api/office/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyName,
          // Send the unsaved typed value as dry-run if present
          dryRunValue: value.trim() || undefined,
        }),
      });
      const data = await res.json();
      setConnection({
        type: data.success ? 'success' : 'error',
        message: data.message || (data.success ? '✅ Connected' : '❌ Failed'),
      });
    } catch {
      setConnection({ type: 'error', message: '❌ Connection failed' });
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div>
        <h4 className="text-sm font-black text-white uppercase tracking-widest">{label}</h4>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          {description}{' '}
          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:underline"
          >
            {linkText}
          </a>
        </p>
      </div>

      {/* Last updated badge */}
      {storedMeta && (
        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
          <CheckCircle2 size={12} />
          Key saved — Last updated: {formatDate(storedMeta.last_updated_at)}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={storedMeta ? '••••••••••••••••••••  (enter new key to replace)' : 'Paste your API key here'}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white font-mono text-sm focus:border-orange-500 outline-none placeholder:text-slate-600 transition-colors"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={visible ? 'Hide key' : 'Reveal key'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Connection status */}
      {connection.type !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 text-[11px] font-bold rounded-xl px-4 py-3 ${
            connection.type === 'testing'
              ? 'bg-slate-800 text-slate-400'
              : connection.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-400'
              : 'bg-red-950/60 border border-red-800/50 text-red-400'
          }`}
        >
          {connection.type === 'testing' && <Loader2 size={12} className="animate-spin" />}
          {connection.type === 'success' && <CheckCircle2 size={12} />}
          {connection.type === 'error' && <XCircle size={12} />}
          {connection.type === 'testing' ? 'Testing connection…' : connection.message}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={!value.trim() || saving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
          {saving ? 'Saving…' : 'Save Key'}
        </button>

        <button
          type="button"
          onClick={handleTest}
          disabled={connection.type === 'testing'}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-5 py-2.5 rounded-xl text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all"
        >
          {connection.type === 'testing' ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <TestTube2 size={12} />
          )}
          Test Connection
        </button>

        {storedMeta && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="flex items-center gap-2 bg-red-950/60 hover:bg-red-900/60 border border-red-800/40 hover:border-red-700 disabled:opacity-40 px-5 py-2.5 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-widest transition-all ml-auto"
          >
            {removing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Remove Key
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function ApiKeysTab() {
  const [loading, setLoading] = useState(true);
  const [storedKeys, setStoredKeys] = useState<KeyMeta[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch('/api/office/api-keys');
      if (!res.ok) return;
      const data = await res.json();
      setStoredKeys(data.keys ?? []);
      setAuditLog(data.logs ?? []);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const handleSave = async (keyName: string, keyValue: string) => {
    setSaveResult(null);
    try {
      const res = await fetch('/api/office/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyName, keyValue }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveResult({ type: 'success', message: data.message || 'API key saved successfully.' });
        await fetchMeta();
      } else {
        setSaveResult({ type: 'error', message: data.error || 'Failed to save key.' });
      }
    } catch {
      setSaveResult({ type: 'error', message: 'An unexpected error occurred.' });
    }
  };

  const handleRemove = async (keyName: string) => {
    setSaveResult(null);
    try {
      const res = await fetch('/api/office/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyName }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveResult({ type: 'success', message: `${keyDisplayName(keyName)} key removed. Falling back to environment variable.` });
        await fetchMeta();
      } else {
        setSaveResult({ type: 'error', message: data.error || 'Failed to remove key.' });
      }
    } catch {
      setSaveResult({ type: 'error', message: 'An unexpected error occurred.' });
    }
  };

  const geminiMeta = storedKeys.find((k) => k.key_name === 'gemini') ?? null;
  const brevoMeta = storedKeys.find((k) => k.key_name === 'brevo') ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Security Warning Banner */}
      <div className="flex items-start gap-4 bg-amber-950/40 border border-amber-700/50 rounded-2xl px-6 py-5">
        <ShieldAlert size={20} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-amber-400 text-sm font-black uppercase tracking-widest">Keep your API keys private</p>
          <p className="text-amber-300/70 text-[11px] mt-1 leading-relaxed">
            Never share your API keys with anyone. Keys are encrypted with AES-256 before being stored and are never
            sent to the browser in plain text.
          </p>
        </div>
      </div>

      {/* Save result toast */}
      {saveResult && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold ${
            saveResult.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-400'
              : 'bg-red-950/60 border border-red-800/50 text-red-400'
          }`}
        >
          {saveResult.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {saveResult.message}
        </motion.div>
      )}

      {/* Gemini Key */}
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Key size={18} className="text-orange-500" />
          <h3 className="text-white font-black uppercase tracking-[0.15em] text-sm">Gemini API Key</h3>
        </div>

        <ApiKeyField
          id="gemini-api-key"
          keyName="gemini"
          label="Gemini API Key"
          description="Your Google Gemini API key powers the AI Assistant. Get yours at"
          linkText="aistudio.google.com"
          linkHref="https://aistudio.google.com/app/apikey"
          storedMeta={geminiMeta}
          onSave={handleSave}
          onRemove={handleRemove}
        />

        <div className="flex items-start gap-3 bg-slate-900/40 border border-slate-800/50 rounded-xl px-5 py-4">
          <AlertTriangle size={14} className="text-slate-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            <strong className="text-slate-400">Key priority:</strong> If a key is saved here, it overrides the{' '}
            <code className="text-orange-400/80 bg-slate-800/60 px-1 rounded">GEMINI_API_KEY</code> environment variable.
            Remove the saved key to revert to the environment variable.
          </p>
        </div>
      </section>

      {/* Brevo Key */}
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Key size={18} className="text-orange-500" />
          <h3 className="text-white font-black uppercase tracking-[0.15em] text-sm">Brevo API Key</h3>
        </div>

        <ApiKeyField
          id="brevo-api-key"
          keyName="brevo"
          label="Brevo API Key"
          description="Your Brevo API key is used to send emails from the dashboard. Get yours at"
          linkText="app.brevo.com"
          linkHref="https://app.brevo.com/settings/keys/api"
          storedMeta={brevoMeta}
          onSave={handleSave}
          onRemove={handleRemove}
        />

        <div className="flex items-start gap-3 bg-slate-900/40 border border-slate-800/50 rounded-xl px-5 py-4">
          <AlertTriangle size={14} className="text-slate-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            <strong className="text-slate-400">Key priority:</strong> If a key is saved here, it overrides the{' '}
            <code className="text-orange-400/80 bg-slate-800/60 px-1 rounded">BREVO_API_KEY</code> environment variable.
            Remove the saved key to revert to the environment variable.
          </p>
        </div>
      </section>

      {/* Security Audit Log */}
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8 space-y-5">
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-orange-500" />
          <h3 className="text-white font-black uppercase tracking-[0.15em] text-sm">Security Audit Log</h3>
        </div>

        {auditLog.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No key activity has been recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {auditLog.map((entry, i) => (
              <li
                key={i}
                className="flex items-center gap-3 bg-slate-900/50 border border-slate-800/50 rounded-xl px-5 py-3"
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    entry.action === 'removed'
                      ? 'bg-red-500'
                      : entry.action === 'added'
                      ? 'bg-emerald-500'
                      : 'bg-orange-500'
                  }`}
                />
                <span className="text-[11px] text-slate-300 font-medium flex-1">
                  <strong className="text-white capitalize">{keyDisplayName(entry.key_name)} key</strong>{' '}
                  {actionLabel(entry.action)}
                  {' — '}
                  <span className="text-slate-500">{formatDate(entry.performed_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  );
}
