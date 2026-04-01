'use client';

import { useState } from 'react';
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
                          <td colSpan={6} className="p-0">
                            <ExpandedRow log={log} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
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
    </div>
  );
}
