'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Activity, AlertTriangle, CheckCircle, XCircle, HelpCircle, AlertCircle, Clock, Filter, ChevronDown, Search, X, MessageSquare, RefreshCw, Eye, BarChart3, TrendingUp, Calendar, Download, Zap, Target, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface DiagnosticsSummary {
  totalActions: number;
  confirmed: number;
  failed: number;
  couldNotVerify: number;
  unsupported: number;
  needInfo: number;
  attempted: number;
  ambiguousMatches: number;
}

interface ReliabilityMetrics {
  totalActions: number;
  totalConfirmed: number;
  totalFailed: number;
  totalCouldNotVerify: number;
  totalUnsupported: number;
  totalNeedInfo: number;
  totalAttempted: number;
  totalAmbiguous: number;
  confirmedRate: number;
  failedRate: number;
  couldNotVerifyRate: number;
  unsupportedRate: number;
  needInfoRate: number;
  ambiguousRate: number;
  averageLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  topFailingTools: Array<{ tool: string; count: number; failureRate: number }>;
  topUnsupportedTools: Array<{ tool: string; count: number }>;
  ambiguousPatterns: Array<{ pattern: string; count: number }>;
  errorBreakdown: Array<{ errorType: string; count: number; percentage: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  dailyTrends: Array<{
    date: string;
    total: number;
    confirmed: number;
    failed: number;
    successRate: number;
    avgLatencyMs: number;
  }>;
  toolBreakdown: Array<{
    tool: string;
    total: number;
    confirmed: number;
    failed: number;
    successRate: number;
    avgLatencyMs: number;
  }>;
  periodStart: string;
  periodEnd: string;
  daysCovered: number;
}

interface ToolUsage {
  tool: string;
  count: number;
}

interface RecentAction {
  id: string;
  timestamp: string;
  userMessage: string;
  toolName: string;
  targetReference: string;
  status: string;
  verified: boolean;
  errorType: string | null;
  errorMessage: string | null;
  summary: string;
  nextStep: string;
  rawStatus: any;
}

interface FailedAction {
  id: string;
  timestamp: string;
  userMessage: string;
  toolName: string;
  targetReference: string;
  status: string;
  error: string;
  nextStep: string;
  summary: string;
  rawStatus: any;
  rawToolResult: any;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ActionsByDay {
  date: string;
  confirmed: number;
  failed: number;
  could_not_verify: number;
  unsupported: number;
  need_info: number;
  attempted: number;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.FC<any>; label: string }> = {
  confirmed: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle, label: 'Confirmed' },
  attempted: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock, label: 'Attempted' },
  could_not_verify: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Unverified' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Failed' },
  need_info: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: HelpCircle, label: 'Need Info' },
  unsupported: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: AlertCircle, label: 'Unsupported' },
};

function formatRand(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(value).replace('ZAR', 'R');
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.attempted;
  const StatusIcon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md border ${config.border} ${config.bg} px-2 py-1`}>
      <StatusIcon size={12} className={config.color} />
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${config.color}`}>{config.label}</span>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, trend, color = 'blue' }: {
  title: string;
  value: number | string;
  icon: React.FC<any>;
  trend?: { value: number; label: string };
  color?: string;
}) {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    red: 'border-red-500/30 bg-red-500/10 text-red-400',
    green: 'border-green-500/30 bg-green-500/10 text-green-400',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    slate: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  }[color];

  return (
    <div className={`rounded-xl border ${colorClasses} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{title}</p>
          <p className="mt-1 text-2xl font-black">{value}</p>
          {trend && (
            <p className="mt-1 text-xs font-medium opacity-80">{trend.label}</p>
          )}
        </div>
        <Icon size={24} className="opacity-50" />
      </div>
    </div>
  );
}

export default function AiDiagnosticsPage() {
  const [data, setData] = useState<{
    summary: DiagnosticsSummary;
    toolUsage: ToolUsage[];
    recentActions: RecentAction[];
    failedActions: FailedAction[];
    conversations: Conversation[];
    unsupportedByTool: ToolUsage[];
    actionsByDay: ActionsByDay[];
    reliabilityMetrics?: ReliabilityMetrics;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toolFilter, setToolFilter] = useState('');
  const [errorTypeFilter, setErrorTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Views
  const [selectedFailedAction, setSelectedFailedAction] = useState<FailedAction | null>(null);
  const [showRecentConversations, setShowRecentConversations] = useState(false);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (statusFilter) params.set('status', statusFilter);
      if (toolFilter) params.set('toolName', toolFilter);
      if (errorTypeFilter) params.set('errorType', errorTypeFilter);

      const response = await fetch(`/api/office/ai-diagnostics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch diagnostics');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, statusFilter, toolFilter, errorTypeFilter]);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setToolFilter('');
    setErrorTypeFilter('');
  };

  const exportData = () => {
    if (!data) return;

    const csvContent = [
      ['Timestamp', 'User Message', 'Tool', 'Target Reference', 'Status', 'Verified', 'Error Type', 'Summary'].join(','),
      ...data.recentActions.map(action => [
        action.timestamp,
        `"${action.userMessage.replace(/"/g, '""')}"`,
        action.toolName,
        action.targetReference,
        action.status,
        action.verified ? 'Yes' : 'No',
        action.errorType || '',
        `"${action.summary.replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-diagnostics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-3 text-lg font-bold text-white">Loading diagnostics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F19] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <span className="ml-3 text-lg font-bold text-white">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#0B0F19] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">AI Diagnostics</h1>
            <p className="mt-2 text-slate-400">Monitor AI assistant performance and troubleshoot issues</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            >
              <Filter size={16} />
              Filters
              {(dateFrom || dateTo || statusFilter || toolFilter || errorTypeFilter) && (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs text-black">
                  {Object.values({ dateFrom, dateTo, statusFilter, toolFilter, errorTypeFilter }).filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={fetchDiagnostics}
              className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400 hover:bg-orange-500/20"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden rounded-xl border border-slate-800/50 bg-slate-900/50 p-6"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="failed">Failed</option>
                    <option value="could_not_verify">Could Not Verify</option>
                    <option value="unsupported">Unsupported</option>
                    <option value="need_info">Need Info</option>
                    <option value="attempted">Attempted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Tool</label>
                  <select
                    value={toolFilter}
                    onChange={(e) => setToolFilter(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All Tools</option>
                    {data.toolUsage.map((tool) => (
                      <option key={tool.tool} value={tool.tool}>
                        {tool.tool} ({tool.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Error Type</label>
                  <select
                    value={errorTypeFilter}
                    onChange={(e) => setErrorTypeFilter(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All Errors</option>
                    <option value="error">Has Error</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-slate-400 hover:text-white"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Actions"
            value={data.summary.totalActions}
            icon={Activity}
            color="blue"
          />
          <SummaryCard
            title="Confirmed"
            value={data.summary.confirmed}
            icon={CheckCircle}
            color="green"
          />
          <SummaryCard
            title="Failed"
            value={data.summary.failed}
            icon={XCircle}
            color="red"
          />
          <SummaryCard
            title="Success Rate"
            value={`${data.summary.totalActions > 0 ? Math.round((data.summary.confirmed / data.summary.totalActions) * 100) : 0}%`}
            icon={TrendingUp}
            color="slate"
          />
        </div>

        {/* Secondary Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Could Not Verify"
            value={data.summary.couldNotVerify}
            icon={AlertTriangle}
            color="amber"
          />
          <SummaryCard
            title="Unsupported"
            value={data.summary.unsupported}
            icon={AlertCircle}
            color="slate"
          />
          <SummaryCard
            title="Need Info"
            value={data.summary.needInfo}
            icon={HelpCircle}
            color="blue"
          />
          <SummaryCard
            title="Ambiguous Matches"
            value={data.summary.ambiguousMatches}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Reliability Metrics Cards (if available) */}
        {data.reliabilityMetrics && data.reliabilityMetrics.totalActions > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-orange-500" />
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Reliability Metrics</h2>
              <span className="text-xs text-slate-500">
                ({data.reliabilityMetrics.periodStart} to {data.reliabilityMetrics.periodEnd} · {data.reliabilityMetrics.daysCovered} days)
              </span>
            </div>
            
            {/* Rate Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400/70">Confirmed Rate</p>
                <p className="mt-1 text-2xl font-black text-green-400">{data.reliabilityMetrics.confirmedRate}%</p>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/70">Failed Rate</p>
                <p className="mt-1 text-2xl font-black text-red-400">{data.reliabilityMetrics.failedRate}%</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/70">Unverified Rate</p>
                <p className="mt-1 text-2xl font-black text-amber-400">{data.reliabilityMetrics.couldNotVerifyRate}%</p>
              </div>
              <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/70">Unsupported Rate</p>
                <p className="mt-1 text-2xl font-black text-slate-400">{data.reliabilityMetrics.unsupportedRate}%</p>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/70">Avg Latency</p>
                <p className="mt-1 text-2xl font-black text-purple-400">
                  {data.reliabilityMetrics.averageLatencyMs > 1000 
                    ? `${(data.reliabilityMetrics.averageLatencyMs / 1000).toFixed(1)}s`
                    : `${data.reliabilityMetrics.averageLatencyMs}ms`}
                </p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/70">P95 Latency</p>
                <p className="mt-1 text-2xl font-black text-blue-400">
                  {data.reliabilityMetrics.p95LatencyMs > 1000 
                    ? `${(data.reliabilityMetrics.p95LatencyMs / 1000).toFixed(1)}s`
                    : `${data.reliabilityMetrics.p95LatencyMs}ms`}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Recent Actions Table */}
        <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-orange-500" />
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Recent Actions</h2>
            </div>
            <span className="text-sm font-bold text-slate-400">
              {data.recentActions.length} actions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-[#0B0F19]/50">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User Message</th>
                  <th className="px-6 py-4">Tool</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Verified</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {data.recentActions.length > 0 ? (
                  data.recentActions.map((action) => (
                    <tr key={action.id} className="group hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-5 text-slate-400 text-xs font-medium">
                        {format(new Date(action.timestamp), 'dd MMM HH:mm')}
                      </td>
                      <td className="px-6 py-5 text-white text-sm font-medium max-w-xs truncate">
                        {action.userMessage}
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-xs font-bold uppercase">
                        {action.toolName || 'Unknown'}
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-xs">
                        {action.targetReference || '-'}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={action.status} />
                      </td>
                      <td className="px-6 py-5">
                        {action.verified ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <XCircle size={16} className="text-slate-500" />
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => setSelectedFailedAction(action as any)}
                          className="text-slate-400 hover:text-orange-500 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                      No recent actions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tool Usage & Failed Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tool Usage */}
          <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <BarChart3 size={20} className="text-orange-500" />
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Tool Usage</h2>
              </div>
            </div>
            <div className="p-6">
              {data.toolUsage.length > 0 ? (
                <div className="space-y-3">
                  {data.toolUsage.slice(0, 10).map((tool) => (
                    <div key={tool.tool} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{tool.tool}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{
                              width: `${data.toolUsage.length > 0 ? (tool.count / data.toolUsage[0].count) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400 w-8 text-right">{tool.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-600 font-bold uppercase tracking-widest text-xs py-8">
                  No tool usage data
                </p>
              )}
            </div>
          </div>

          {/* Tool Breakdown with Failure Rates */}
          {data.reliabilityMetrics && data.reliabilityMetrics.toolBreakdown.length > 0 && (
            <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <BarChart3 size={20} className="text-orange-500" />
                  <h2 className="text-lg font-black uppercase tracking-tight text-white">Tool Performance</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {data.reliabilityMetrics.toolBreakdown.slice(0, 8).map((tool) => (
                    <div key={tool.tool} className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-sm font-bold text-white">{tool.tool}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${tool.successRate >= 80 ? 'text-green-400' : tool.successRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {tool.successRate}% success
                          </span>
                          <span className="text-xs text-slate-500">· {tool.total} calls</span>
                          {tool.avgLatencyMs > 0 && (
                            <span className="text-xs text-slate-500">· {tool.avgLatencyMs}ms avg</span>
                          )}
                        </div>
                      </div>
                      <div className="w-16 bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${tool.successRate >= 80 ? 'bg-green-500' : tool.successRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${tool.successRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trend Chart */}
        {data.reliabilityMetrics && data.reliabilityMetrics.dailyTrends.length > 1 && (
          <>
            {(() => {
              const metrics = data.reliabilityMetrics!;
              return (
          <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <TrendingUp size={20} className="text-orange-500" />
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Success Rate Trend</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="relative h-40">
                <div className="absolute inset-0 flex items-end justify-between gap-1">
                  {metrics.dailyTrends.map((day, idx) => {
                    const maxTotal = Math.max(...metrics.dailyTrends.map(d => d.total), 1);
                    const height = (day.total / maxTotal) * 100;
                    const successHeight = (day.successRate / 100) * height;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-slate-700 rounded-t" style={{ height: `${height}%`, minHeight: '4px' }}>
                          <div 
                            className="w-full bg-green-500 rounded-t" 
                            style={{ height: `${Math.max((successHeight / height) * 100, 0)}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-slate-500">
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-slate-400">Success</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-600 rounded" />
                  <span className="text-slate-400">Failed/Unverified</span>
                </div>
              </div>
            </div>
          </div>
              );
            })()}
          </>
        )}

        {/* Error Breakdown & Status Breakdown */}
        {data.reliabilityMetrics && data.reliabilityMetrics.errorBreakdown.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Error Breakdown */}
            <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-red-500" />
                  <h2 className="text-lg font-black uppercase tracking-tight text-white">Error Breakdown</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {data.reliabilityMetrics.errorBreakdown.map((err, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">{err.errorType}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-red-400">{err.count}</span>
                        <span className="text-xs text-slate-500">({err.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <Activity size={20} className="text-orange-500" />
                  <h2 className="text-lg font-black uppercase tracking-tight text-white">Status Breakdown</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {data.reliabilityMetrics.statusBreakdown.map((st, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <StatusBadge status={st.status} />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{st.count}</span>
                        <span className="text-xs text-slate-500">({st.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Failing Tools */}
        {data.reliabilityMetrics && data.reliabilityMetrics.topFailingTools.length > 0 && (
          <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500" />
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Top Failing Tools</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.reliabilityMetrics.topFailingTools.slice(0, 6).map((tool, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{tool.tool}</span>
                      <span className="text-xs font-bold text-red-400">{tool.failureRate}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div 
                        className="bg-red-500 h-1.5 rounded-full" 
                        style={{ width: `${tool.failureRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{tool.count} failures</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-blue-500" />
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Recent Conversations</h2>
              </div>
              <span className="text-sm font-bold text-slate-400">
                {data.failedActions.length} failures
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {data.failedActions.length > 0 ? (
                <div className="divide-y divide-slate-800/30">
                  {data.failedActions.slice(0, 10).map((action) => (
                    <div key={action.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={action.status} />
                            <span className="text-xs font-bold text-slate-400">
                              {format(new Date(action.timestamp), 'dd MMM HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white mb-1">{action.userMessage}</p>
                          <p className="text-xs text-slate-400 mb-2">
                            Tool: {action.toolName} • Target: {action.targetReference || 'N/A'}
                          </p>
                          {action.error && (
                            <p className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
                              {action.error}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedFailedAction(action)}
                          className="text-slate-400 hover:text-orange-500 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                  No failed actions
                </div>
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="rounded-xl border border-slate-800/50 bg-[#151B28] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-blue-500" />
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Recent Conversations</h2>
              </div>
            <span className="text-sm font-bold text-slate-400">
              {data.conversations.length} conversations
            </span>
          </div>
          <div className="p-6">
            {data.conversations.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.conversations.map((conv) => (
                  <div key={conv.id} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white truncate">{conv.title || 'Untitled Conversation'}</h3>
                      <span className="text-xs text-slate-400">
                        {format(new Date(conv.updated_at), 'dd MMM HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-600 font-bold uppercase tracking-widest text-xs py-8">
                No recent conversations
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Failed Action Detail Modal */}
      <AnimatePresence>
        {selectedFailedAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFailedAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151B28] rounded-xl border border-slate-800/50 max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Action Details</h3>
                <button
                  onClick={() => setSelectedFailedAction(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Status</h4>
                    <StatusBadge status={selectedFailedAction.status} />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Timestamp</h4>
                    <p className="text-white font-medium">
                      {format(new Date(selectedFailedAction.timestamp), 'PPpp')}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">User Message</h4>
                    <p className="text-white font-medium bg-slate-800/50 rounded-lg p-3">
                      {selectedFailedAction.userMessage}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Tool Used</h4>
                      <p className="text-white font-medium">{selectedFailedAction.toolName || 'Unknown'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Target Reference</h4>
                      <p className="text-white font-medium">{selectedFailedAction.targetReference || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedFailedAction.error && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Error</h4>
                      <p className="text-red-400 font-medium bg-red-500/10 rounded-lg p-3">
                        {selectedFailedAction.error}
                      </p>
                    </div>
                  )}

                  {selectedFailedAction.summary && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Summary</h4>
                      <p className="text-white font-medium bg-slate-800/50 rounded-lg p-3">
                        {selectedFailedAction.summary}
                      </p>
                    </div>
                  )}

                  {selectedFailedAction.nextStep && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Next Steps</h4>
                      <p className="text-slate-300 font-medium bg-slate-800/50 rounded-lg p-3">
                        {selectedFailedAction.nextStep}
                      </p>
                    </div>
                  )}

                  {selectedFailedAction.rawStatus && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Raw Status Data</h4>
                      <pre className="text-xs text-slate-400 bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        {JSON.stringify(selectedFailedAction.rawStatus, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedFailedAction.rawToolResult && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Raw Tool Result</h4>
                      <pre className="text-xs text-slate-400 bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        {JSON.stringify(selectedFailedAction.rawToolResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}