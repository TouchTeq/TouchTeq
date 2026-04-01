'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import {
  Bot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Zap,
  X,
  Play,
  Shield,
  ShieldAlert,
  Eye,
  Copy,
  ArrowRight,
  AlertTriangle,
  Loader2,
  FileText,
  MessageSquare,
} from 'lucide-react';

interface AiLogEntry {
  id: string;
  created_at: string;
  tool_name: string;
  action_status: string;
  target_type: string | null;
  target_reference: string | null;
  latency_ms: number | null;
  error_message: string | null;
  summary: string | null;
  user_message: string | null;
  tool_args: Record<string, unknown> | null;
  raw_tool_result: Record<string, unknown> | null;
  verified: boolean;
  verification_details?: Record<string, unknown> | null;
  next_step?: string | null;
  model_name?: string | null;
  conversation_id?: string | null;
}

type SafetyLevel = 'SAFE' | 'DRY_RUN' | 'BLOCKED';

interface SafetyConfig {
  level: SafetyLevel;
  description: string;
  dryRunSupported: boolean;
}

interface ReplayResult {
  actionLogId: string;
  toolName: string;
  safetyLevel: SafetyLevel;
  replayAllowed: boolean;
  replayMode: 'direct' | 'dry_run' | 'blocked';
  originalResult: Record<string, unknown> | null;
  replayResult: Record<string, unknown> | null;
  replayError: string | null;
  replayTimestamp: string;
  differences: Array<{ field: string; original: unknown; replay: unknown; match: boolean }>;
  validationChecks: Array<{ check: string; passed: boolean; detail: string }>;
  warning: string | null;
}

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Could Not Verify', value: 'could_not_verify' },
  { label: 'Unsupported', value: 'unsupported' },
  { label: 'Need Info', value: 'need_info' },
];

function statusPill(status: string) {
  switch (status) {
    case 'confirmed':
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
          <CheckCircle2 size={10} /> Confirmed
        </span>
      );
    case 'failed':
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
          <XCircle size={10} /> Failed
        </span>
      );
    case 'could_not_verify':
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
          <AlertCircle size={10} /> Unverified
        </span>
      );
    case 'unsupported':
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded">
          <HelpCircle size={10} /> Unsupported
        </span>
      );
    case 'need_info':
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
          <HelpCircle size={10} /> Need Info
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded">
          {status}
        </span>
      );
  }
}

function toolLabel(name: string) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function safetyBadge(level: SafetyLevel) {
  switch (level) {
    case 'SAFE':
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
          <Shield size={10} /> Safe
        </span>
      );
    case 'DRY_RUN':
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
          <ShieldAlert size={10} /> Dry Run
        </span>
      );
    case 'BLOCKED':
      return (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
          <ShieldAlert size={10} /> Blocked
        </span>
      );
  }
}

function ExpandedRow({ log }: { log: AiLogEntry }) {
  return (
    <div className="bg-[#0B0F19] border-t border-slate-800/50 px-6 py-5 space-y-4">
      {log.user_message && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">User Message</p>
          <p className="text-sm text-slate-300 italic">"{log.user_message}"</p>
        </div>
      )}
      {log.summary && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Summary</p>
          <p className="text-sm text-slate-300">{log.summary}</p>
        </div>
      )}
      {log.error_message && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Error</p>
          <p className="text-sm text-red-400">{log.error_message}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {log.tool_args && Object.keys(log.tool_args).length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Input Parameters</p>
            <pre className="text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(log.tool_args, null, 2)}
            </pre>
          </div>
        )}
        {log.raw_tool_result && Object.keys(log.raw_tool_result).length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Result Data</p>
            <pre className="text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(log.raw_tool_result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <button
          onClick={handleCopy}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1"
        >
          <Copy size={10} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function DebugModal({
  log,
  onClose,
}: {
  log: AiLogEntry;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'replay' | 'context'>('details');
  const [safetyConfig, setSafetyConfig] = useState<SafetyConfig | null>(null);
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/office/ai-action-replay?id=${log.id}`);
      if (!res.ok) throw new Error('Failed to fetch action details');
      const json = await res.json();
      setSafetyConfig(json.safetyConfig);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [log.id]);

  const handleReplay = useCallback(async (forceReplay: boolean = false) => {
    setReplaying(true);
    setError(null);
    setShowForceConfirm(false);
    try {
      const res = await fetch('/api/office/ai-action-replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: log.id, forceReplay }),
      });
      if (!res.ok) throw new Error('Replay failed');
      const json = await res.json();
      setReplayResult(json);
      setActiveTab('replay');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReplaying(false);
    }
  }, [log.id]);

  const handleNormalReplay = useCallback(() => handleReplay(false), [handleReplay]);
  const handleForceReplay = useCallback(() => handleReplay(true), [handleReplay]);

  const canReplay = safetyConfig?.level === 'SAFE' || safetyConfig?.level === 'DRY_RUN';
  const isBlocked = safetyConfig?.level === 'BLOCKED';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8">
      <div className="w-full max-w-4xl mx-4 bg-[#0F1623] border border-slate-700/50 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <Eye size={18} className="text-orange-500" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                Action Debug: {toolLabel(log.tool_name)}
              </h2>
              <p className="text-xs text-slate-500">
                {log.target_reference || log.target_type || 'No target'} · {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-slate-800/50">
          {(['details', 'replay', 'context'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'details' && !safetyConfig) fetchDetails();
                setActiveTab(tab);
              }}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-t-lg transition-all ${
                activeTab === tab
                  ? 'bg-slate-800/50 text-orange-400 border-b-2 border-orange-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'details' ? 'Details' : tab === 'replay' ? 'Replay' : 'Context'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle size={14} className="text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Safety badge + replay button */}
              <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {loading ? (
                    <Loader2 size={14} className="text-slate-500 animate-spin" />
                  ) : safetyConfig ? (
                    <>
                      {safetyBadge(safetyConfig.level)}
                      <span className="text-xs text-slate-400">{safetyConfig.description}</span>
                    </>
                  ) : (
                    <button
                      onClick={fetchDetails}
                      className="text-[10px] font-bold text-orange-400 hover:text-orange-300"
                    >
                      Load safety info
                    </button>
                  )}
                </div>
                {safetyConfig && (
                  <div className="flex items-center gap-2">
                    {isBlocked ? (
                      <>
                        <button
                          onClick={() => setShowForceConfirm(true)}
                          disabled={replaying}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-amber-600 text-white hover:bg-amber-500 shadow"
                        >
                          <Play size={12} />
                          Force Replay
                        </button>
                        <span className="text-[10px] text-slate-500">
                          May mutate data
                        </span>
                      </>
                    ) : (
                      <button
                        onClick={handleNormalReplay}
                        disabled={!canReplay || replaying}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          canReplay
                            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {replaying ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Play size={12} />
                        )}
                        {canReplay ? 'Replay in Debug Mode' : 'Replay'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action metadata */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                  {statusPill(log.action_status)}
                </div>
                <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Verified</p>
                  <p className="text-sm font-bold text-white">{log.verified ? 'Yes' : 'No'}</p>
                </div>
                <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Latency</p>
                  <p className="text-sm font-bold text-white">
                    {log.latency_ms ? `${log.latency_ms}ms` : '—'}
                  </p>
                </div>
                <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Model</p>
                  <p className="text-xs text-slate-400">{log.model_name || '—'}</p>
                </div>
                <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Target</p>
                  <p className="text-xs text-slate-400">
                    {log.target_type}{log.target_reference ? `: ${log.target_reference}` : ''}
                  </p>
                </div>
                {log.next_step && (
                  <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Next Step</p>
                    <p className="text-xs text-slate-400">{log.next_step}</p>
                  </div>
                )}
              </div>

              {/* User message */}
              {log.user_message && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">User Message</p>
                  <p className="text-sm text-slate-300 italic bg-slate-900/30 border border-slate-800/30 rounded-lg p-3">
                    "{log.user_message}"
                  </p>
                </div>
              )}

              {/* Tool args */}
              {log.tool_args && Object.keys(log.tool_args).length > 0 && (
                <JsonBlock label="Tool Arguments" data={log.tool_args} />
              )}

              {/* Original result */}
              {log.raw_tool_result && Object.keys(log.raw_tool_result).length > 0 && (
                <JsonBlock label="Original Result" data={log.raw_tool_result} />
              )}

              {/* Verification details */}
              {log.verification_details && Object.keys(log.verification_details).length > 0 && (
                <JsonBlock label="Verification Details" data={log.verification_details} />
              )}

              {/* Error */}
              {log.error_message && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Error</p>
                  <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    {log.error_message}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'replay' && (
            <div className="space-y-4">
              {!replayResult && !replaying && (
                <div className="text-center py-12">
                  <Play size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-1">No replay has been executed yet</p>
                  <p className="text-xs text-slate-600 mb-4">
                    {isBlocked
                      ? 'This tool is classified as BLOCKED — replay would mutate production data.'
                      : 'Click "Replay in Debug Mode" to execute a safe replay.'}
                  </p>
                  {canReplay && (
                    <button
                      onClick={handleNormalReplay}
                      disabled={replaying}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
                    >
                      <Play size={14} /> Replay in Debug Mode
                    </button>
                  )}
                </div>
              )}

              {replaying && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="text-orange-500 animate-spin mr-3" />
                  <p className="text-sm text-slate-400">Executing replay...</p>
                </div>
              )}

              {replayResult && (
                <>
                  {/* Warning banner */}
                  {replayResult.warning && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                      replayResult.replayMode === 'dry_run'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : replayResult.replayMode === 'blocked'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-blue-500/10 border-blue-500/30'
                    }`}>
                      <AlertTriangle size={14} className={
                        replayResult.replayMode === 'dry_run' ? 'text-amber-400 mt-0.5' :
                        replayResult.replayMode === 'blocked' ? 'text-red-400 mt-0.5' :
                        'text-blue-400 mt-0.5'
                      } />
                      <p className="text-xs text-slate-300">{replayResult.warning}</p>
                    </div>
                  )}

                  {/* Replay mode badge */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mode:</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      replayResult.replayMode === 'direct' ? 'bg-green-500/10 text-green-400' :
                      replayResult.replayMode === 'dry_run' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {replayResult.replayMode === 'direct' ? 'Direct Execution' :
                       replayResult.replayMode === 'dry_run' ? 'Dry Run (No Mutation)' :
                       'Blocked'}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      · {format(new Date(replayResult.replayTimestamp), 'HH:mm:ss')}
                    </span>
                  </div>

                  {/* Validation checks */}
                  {replayResult.validationChecks.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Validation Checks</p>
                      <div className="space-y-1">
                        {replayResult.validationChecks.map((check, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-slate-900/30 border border-slate-800/30 rounded">
                            {check.passed ? (
                              <CheckCircle2 size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <span className="text-xs font-bold text-slate-300">{check.check}</span>
                              <p className="text-[11px] text-slate-500">{check.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Differences */}
                  {replayResult.differences.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Original vs Replay Differences
                      </p>
                      <div className="space-y-1">
                        {replayResult.differences.map((diff, i) => (
                          <div key={i} className={`flex items-center gap-3 p-2 rounded border ${
                            diff.match ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'
                          }`}>
                            <span className="text-[10px] font-black text-slate-500 w-32 truncate">{diff.field}</span>
                            <ArrowRight size={10} className="text-slate-600" />
                            <span className="text-xs text-slate-400">{String(diff.original ?? 'null')}</span>
                            <span className="text-slate-600">→</span>
                            <span className={`text-xs font-bold ${diff.match ? 'text-green-400' : 'text-amber-400'}`}>
                              {String(diff.replay ?? 'null')}
                            </span>
                            {diff.match ? (
                              <CheckCircle2 size={10} className="text-green-400 ml-auto" />
                            ) : (
                              <AlertTriangle size={10} className="text-amber-400 ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Replay result data */}
                  {replayResult.replayResult && (
                    <JsonBlock label="Replay Result" data={replayResult.replayResult} />
                  )}

                  {/* Replay error */}
                  {replayResult.replayError && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Replay Error</p>
                      <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                        {replayResult.replayError}
                      </p>
                    </div>
                  )}

                  {/* Replay button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNormalReplay}
                      disabled={replaying}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                      {replaying ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      Re-run Replay
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'context' && (
            <ConversationContextView actionId={log.id} conversationId={log.conversation_id} />
          )}
        </div>

        {/* Force Replay Confirmation Modal */}
        {showForceConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
            <div className="w-full max-w-md mx-4 bg-[#0F1623] border border-red-500/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-red-400" />
                <h3 className="text-lg font-black uppercase tracking-widest text-white">
                  Confirm Force Replay
                </h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                You are about to replay a BLOCKED action: <span className="font-bold text-orange-400">{toolLabel(log.tool_name)}</span>
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                <p className="text-xs text-red-300">
                  This will execute the original tool with the logged arguments. This action may:
                </p>
                <ul className="mt-2 text-xs text-red-300 list-disc list-inside">
                  <li>Create, update, or delete records in your database</li>
                  <li>Send emails or notifications</li>
                  <li>Change invoice/document statuses</li>
                  <li>Trigger other side effects</li>
                </ul>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Only proceed if you understand the risks and have a backup.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowForceConfirm(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForceReplay}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-500"
                >
                  Yes, Execute Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationContextView({ actionId, conversationId }: { actionId: string; conversationId?: string | null }) {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    fetch(`/api/office/ai-action-replay?id=${actionId}`)
      .then(res => res.json())
      .then(data => {
        setContext(data.conversationContext);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  });

  if (!conversationId) {
    return (
      <div className="text-center py-8">
        <MessageSquare size={24} className="text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No conversation linked to this action</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="text-slate-500 animate-spin mr-2" />
        <p className="text-sm text-slate-500">Loading conversation context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle size={18} className="text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="text-center py-8">
        <FileText size={18} className="text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {context.conversation && (
        <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Conversation</p>
          <p className="text-sm font-bold text-white">{context.conversation.title || 'Untitled'}</p>
          <p className="text-xs text-slate-500">
            {format(new Date(context.conversation.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
      )}

      {context.messages && context.messages.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Messages</p>
          <div className="space-y-2">
            {context.messages.map((msg: any, i: number) => (
              <div key={i} className={`p-3 rounded-lg border ${
                msg.role === 'user' ? 'bg-blue-500/5 border-blue-500/20' :
                msg.role === 'assistant' ? 'bg-slate-900/50 border-slate-800/50' :
                msg.role === 'tool' ? 'bg-amber-500/5 border-amber-500/20' :
                'bg-slate-900/30 border-slate-800/30'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    msg.role === 'user' ? 'text-blue-400' :
                    msg.role === 'assistant' ? 'text-slate-400' :
                    msg.role === 'tool' ? 'text-amber-400' :
                    'text-slate-500'
                  }`}>
                    {msg.role}{msg.tool_name ? ` (${toolLabel(msg.tool_name)})` : ''}
                  </span>
                  <span className="text-[10px] text-slate-600">#{msg.message_order}</span>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiLogClient({
  logs,
  totalCount,
  page,
  pageSize,
  toolNames,
  activeStatus,
  activeTool,
}: {
  logs: AiLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  toolNames: string[];
  activeStatus: string;
  activeTool: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<AiLogEntry | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === 'all' || v === '1') params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
          <Bot size={24} className="text-orange-500" />
          AI Action Log
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Persistent audit trail of every action the AI assistant has taken
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-1 bg-[#151B28] border border-slate-800/50 rounded-xl px-1 py-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => navigate({ status: f.value, page: '1' })}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeStatus === f.value
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tool filter */}
        {toolNames.length > 0 && (
          <div className="relative">
            <select
              value={activeTool}
              onChange={(e) => navigate({ tool: e.target.value, page: '1' })}
              className="appearance-none pl-9 pr-8 py-2.5 bg-[#151B28] border border-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
            >
              <option value="all">All Tools</option>
              {toolNames.map((t) => (
                <option key={t} value={t}>
                  {toolLabel(t)}
                </option>
              ))}
            </select>
            <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        )}

        {/* Count badge */}
        <div className="flex items-center px-4 py-2.5 bg-[#151B28] border border-slate-800/50 rounded-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {totalCount.toLocaleString()} {totalCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-[#0B0F19]/50">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Tool</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4 text-right">
                  <span className="flex items-center gap-1 justify-end"><Clock size={10} /> Latency</span>
                </th>
                <th className="px-6 py-4 text-center">Debug</th>
                <th className="px-6 py-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <>
                      <tr
                        key={log.id}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-white">{toolLabel(log.tool_name)}</span>
                          {log.target_type && (
                            <span className="ml-2 text-[10px] text-slate-600 font-medium">{log.target_type}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{statusPill(log.action_status)}</td>
                        <td className="px-6 py-4">
                          {log.target_reference ? (
                            <span className="text-xs font-black text-orange-400">{log.target_reference}</span>
                          ) : log.error_message ? (
                            <span className="text-xs text-red-400 truncate max-w-[180px] block" title={log.error_message}>
                              {log.error_message.slice(0, 60)}{log.error_message.length > 60 ? '…' : ''}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.latency_ms != null ? (
                            <span className={`flex items-center gap-1 justify-end text-xs font-bold ${log.latency_ms > 5000 ? 'text-amber-400' : 'text-slate-500'}`}>
                              <Zap size={10} />
                              {log.latency_ms > 999
                                ? `${(log.latency_ms / 1000).toFixed(1)}s`
                                : `${log.latency_ms}ms`}
                            </span>
                          ) : (
                            <span className="text-slate-700 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDebugLog(log);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-orange-500/20 text-slate-500 hover:text-orange-400 transition-all"
                            title="View action details and replay"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-600 group-hover:text-slate-400" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log.id}-expanded`}>
                          <td colSpan={7} className="p-0">
                            <ExpandedRow log={log} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                    No AI actions logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">
            Page {page} of {totalPages} · {totalCount.toLocaleString()} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ page: String(page - 1) })}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 bg-[#151B28] border border-slate-800/50 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => navigate({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 bg-[#151B28] border border-slate-800/50 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Debug Modal */}
      {debugLog && (
        <DebugModal
          log={debugLog}
          onClose={() => setDebugLog(null)}
        />
      )}
    </div>
  );
}
