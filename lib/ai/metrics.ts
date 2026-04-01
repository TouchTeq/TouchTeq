/**
 * AI Reliability Metrics Computation Library
 * 
 * Computes reliability metrics from action logs, telemetry, and conversation data.
 * Designed for efficiency with aggregation queries and caching-friendly structures.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface AIReliabilityMetrics {
  // Core counts
  totalActions: number;
  totalConfirmed: number;
  totalFailed: number;
  totalCouldNotVerify: number;
  totalUnsupported: number;
  totalNeedInfo: number;
  totalAttempted: number;
  totalAmbiguous: number;

  // Calculated rates (as percentages)
  confirmedRate: number;
  failedRate: number;
  couldNotVerifyRate: number;
  unsupportedRate: number;
  needInfoRate: number;
  ambiguousRate: number;

  // Latency metrics
  averageLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;

  // Top failing tools
  topFailingTools: Array<{ tool: string; count: number; failureRate: number }>;

  // Top unsupported tools
  topUnsupportedTools: Array<{ tool: string; count: number }>;

  // Ambiguous patterns
  ambiguousPatterns: Array<{ pattern: string; count: number }>;

  // Error breakdown
  errorBreakdown: Array<{ errorType: string; count: number; percentage: number }>;

  // Status breakdown
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;

  // Trend data (by day)
  dailyTrends: Array<{
    date: string;
    total: number;
    confirmed: number;
    failed: number;
    couldNotVerify: number;
    unsupported: number;
    successRate: number;
    avgLatencyMs: number;
  }>;

  // Tool breakdown with stats
  toolBreakdown: Array<{
    tool: string;
    total: number;
    confirmed: number;
    failed: number;
    couldNotVerify: number;
    unsupported: number;
    successRate: number;
    avgLatencyMs: number;
  }>;

  // Time period info
  periodStart: string;
  periodEnd: string;
  daysCovered: number;
}

interface QueryFilters {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  toolName?: string;
  status?: string;
}

/**
 * Compute all reliability metrics for a given time period.
 * Uses efficient aggregation queries to avoid expensive scans.
 */
export async function computeReliabilityMetrics(filters: QueryFilters = {}): Promise<AIReliabilityMetrics> {
  const supabase = createAdminClient();
  const { userId, dateFrom, dateTo, toolName, status } = filters;

  // Build base query
  let query = supabase
    .from("ai_action_log")
    .select("*")
    .order("created_at", { ascending: true });

  if (userId) query = query.eq("user_id", userId);
  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
  if (toolName) query = query.eq("tool_name", toolName);
  if (status) query = query.eq("action_status", status);

  const { data: actions, error } = await query;

  if (error) {
    console.error("Failed to fetch actions for metrics:", error);
    throw error;
  }

  const actionsData = actions || [];
  
  if (actionsData.length === 0) {
    return createEmptyMetrics();
  }

  // Compute all metrics
  const metrics = computeMetricsFromData(actionsData);

  // Add period info
  const dates = actionsData.map((a: any) => new Date(a.created_at));
  const periodStart = dates[0]?.toISOString().split("T")[0] || "";
  const periodEnd = dates[dates.length - 1]?.toISOString().split("T")[0] || "";
  const daysCovered = Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    ...metrics,
    periodStart,
    periodEnd,
    daysCovered,
  };
}

function computeMetricsFromData(actions: any[]): Omit<AIReliabilityMetrics, "periodStart" | "periodEnd" | "daysCovered"> {
  const total = actions.length;

  // Core counts
  const confirmed = actions.filter((a) => a.action_status === "confirmed").length;
  const failed = actions.filter((a) => a.action_status === "failed").length;
  const couldNotVerify = actions.filter((a) => a.action_status === "could_not_verify").length;
  const unsupported = actions.filter((a) => a.action_status === "unsupported").length;
  const needInfo = actions.filter((a) => a.action_status === "need_info").length;
  const attempted = actions.filter((a) => a.action_status === "attempted").length;

  // Ambiguous detection
  const ambiguous = actions.filter((a) =>
    a.error_message?.includes("Multiple") ||
    a.error_message?.includes("ambiguous") ||
    a.error_message?.includes("Which") ||
    a.error_message?.includes("several matches")
  ).length;

  // Calculate rates
  const rate = (count: number) => total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

  // Latency calculation
  const latencies = actions
    .map((a) => a.latency_ms)
    .filter((l): l is number => l !== null && l !== undefined);

  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length)
    : 0;
  const medianLatency = sortedLatencies.length > 0
    ? sortedLatencies[Math.floor(sortedLatencies.length / 2)]
    : 0;
  const p95Latency = sortedLatencies.length > 0
    ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)]
    : 0;
  const p99Latency = sortedLatencies.length > 0
    ? sortedLatencies[Math.floor(sortedLatencies.length * 0.99)]
    : 0;

  // Top failing tools (by count of failed + could_not_verify)
  const toolStats: Record<string, { total: number; confirmed: number; failed: number; couldNotVerify: number; unsupported: number; latencies: number[] }> = {};

  for (const action of actions) {
    const tool = action.tool_name || "unknown";
    if (!toolStats[tool]) {
      toolStats[tool] = { total: 0, confirmed: 0, failed: 0, couldNotVerify: 0, unsupported: 0, latencies: [] };
    }
    toolStats[tool].total++;
    if (action.action_status === "confirmed") toolStats[tool].confirmed++;
    if (action.action_status === "failed") toolStats[tool].failed++;
    if (action.action_status === "could_not_verify") toolStats[tool].couldNotVerify++;
    if (action.action_status === "unsupported") toolStats[tool].unsupported++;
    if (action.latency_ms) toolStats[tool].latencies.push(action.latency_ms);
  }

  const failingTools = Object.entries(toolStats)
    .filter(([, stats]) => stats.failed + stats.couldNotVerify > 0)
    .map(([tool, stats]) => ({
      tool,
      count: stats.failed + stats.couldNotVerify,
      failureRate: Math.round(((stats.failed + stats.couldNotVerify) / stats.total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const toolBreakdown = Object.entries(toolStats)
    .map(([tool, stats]) => ({
      tool,
      total: stats.total,
      confirmed: stats.confirmed,
      failed: stats.failed,
      couldNotVerify: stats.couldNotVerify,
      unsupported: stats.unsupported,
      successRate: stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 1000) / 10 : 0,
      avgLatencyMs: stats.latencies.length > 0
        ? Math.round(stats.latencies.reduce((sum, l) => sum + l, 0) / stats.latencies.length)
        : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Top unsupported tools
  const unsupportedTools = Object.entries(toolStats)
    .filter(([, stats]) => stats.unsupported > 0)
    .map(([tool, stats]) => ({ tool, count: stats.unsupported }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Ambiguous patterns (from error messages)
  const ambiguousMap: Record<string, number> = {};
  for (const action of actions) {
    if (action.error_message && (
      action.error_message.includes("Multiple") ||
      action.error_message.includes("ambiguous") ||
      action.error_message.includes("Which")
    )) {
      const match = action.error_message.match(/([A-Za-z\s]+)\s+found/i);
      const pattern = match ? match[1].trim() : "Multiple matches";
      ambiguousMap[pattern] = (ambiguousMap[pattern] || 0) + 1;
    }
  }
  const ambiguousPatterns = Object.entries(ambiguousMap)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Error breakdown
  const errorTypes: Record<string, number> = {};
  for (const action of actions) {
    if (action.action_status === "failed" && action.error_message) {
      const errorMsg = action.error_message;
      let errorType = "Other";
      
      if (errorMsg.includes("not found") || errorMsg.includes("Could not find")) errorType = "Not Found";
      else if (errorMsg.includes("duplicate") || errorMsg.includes("already exists")) errorType = "Duplicate";
      if (errorMsg.includes("validation") || errorMsg.includes("invalid")) errorType = "Validation Error";
      else if (errorMsg.includes("permission") || errorMsg.includes("unauthorized")) errorType = "Permission";
      else if (errorMsg.includes("timeout") || errorMsg.includes("timeout")) errorType = "Timeout";
      else if (errorMsg.includes("database") || errorMsg.includes("db")) errorType = "Database Error";
      else if (errorMsg.includes("API") || errorMsg.includes("external")) errorType = "External API";
      
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    }
  }
  const errorBreakdown = Object.entries(errorTypes)
    .map(([errorType, count]) => ({
      errorType,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  // Status breakdown
  const statusCounts: Record<string, number> = {
    confirmed: confirmed,
    failed: failed,
    could_not_verify: couldNotVerify,
    unsupported: unsupported,
    need_info: needInfo,
    attempted: attempted,
  };
  const statusBreakdown = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  // Daily trends
  const dailyMap: Record<string, { total: number; confirmed: number; failed: number; couldNotVerify: number; unsupported: number; latencies: number[] }> = {};

  for (const action of actions) {
    const date = new Date(action.created_at).toISOString().split("T")[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { total: 0, confirmed: 0, failed: 0, couldNotVerify: 0, unsupported: 0, latencies: [] };
    }
    dailyMap[date].total++;
    if (action.action_status === "confirmed") dailyMap[date].confirmed++;
    if (action.action_status === "failed") dailyMap[date].failed++;
    if (action.action_status === "could_not_verify") dailyMap[date].couldNotVerify++;
    if (action.action_status === "unsupported") dailyMap[date].unsupported++;
    if (action.latency_ms) dailyMap[date].latencies.push(action.latency_ms);
  }

  const dailyTrends = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      total: stats.total,
      confirmed: stats.confirmed,
      failed: stats.failed,
      couldNotVerify: stats.couldNotVerify,
      unsupported: stats.unsupported,
      successRate: stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 1000) / 10 : 0,
      avgLatencyMs: stats.latencies.length > 0
        ? Math.round(stats.latencies.reduce((sum, l) => sum + l, 0) / stats.latencies.length)
        : 0,
    }));

  return {
    totalActions: total,
    totalConfirmed: confirmed,
    totalFailed: failed,
    totalCouldNotVerify: couldNotVerify,
    totalUnsupported: unsupported,
    totalNeedInfo: needInfo,
    totalAttempted: attempted,
    totalAmbiguous: ambiguous,
    confirmedRate: rate(confirmed),
    failedRate: rate(failed),
    couldNotVerifyRate: rate(couldNotVerify),
    unsupportedRate: rate(unsupported),
    needInfoRate: rate(needInfo),
    ambiguousRate: rate(ambiguous),
    averageLatencyMs: avgLatency,
    medianLatencyMs: medianLatency,
    p95LatencyMs: p95Latency,
    p99LatencyMs: p99Latency,
    topFailingTools: failingTools,
    topUnsupportedTools: unsupportedTools,
    ambiguousPatterns,
    errorBreakdown,
    statusBreakdown,
    dailyTrends,
    toolBreakdown,
  };
}

function createEmptyMetrics(): AIReliabilityMetrics {
  return {
    totalActions: 0,
    totalConfirmed: 0,
    totalFailed: 0,
    totalCouldNotVerify: 0,
    totalUnsupported: 0,
    totalNeedInfo: 0,
    totalAttempted: 0,
    totalAmbiguous: 0,
    confirmedRate: 0,
    failedRate: 0,
    couldNotVerifyRate: 0,
    unsupportedRate: 0,
    needInfoRate: 0,
    ambiguousRate: 0,
    averageLatencyMs: 0,
    medianLatencyMs: 0,
    p95LatencyMs: 0,
    p99LatencyMs: 0,
    topFailingTools: [],
    topUnsupportedTools: [],
    ambiguousPatterns: [],
    errorBreakdown: [],
    statusBreakdown: [],
    dailyTrends: [],
    toolBreakdown: [],
    periodStart: "",
    periodEnd: "",
    daysCovered: 0,
  };
}

/**
 * Get metrics for the last N days
 */
export async function getMetricsForLastDays(userId: string, days: number): Promise<AIReliabilityMetrics> {
  const dateTo = new Date().toISOString().split("T")[0];
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return computeReliabilityMetrics({ userId, dateFrom, dateTo });
}

/**
 * Get weekly comparison (this week vs last week)
 */
export async function getWeeklyComparison(userId: string): Promise<{
  thisWeek: AIReliabilityMetrics;
  lastWeek: AIReliabilityMetrics;
  changes: {
    totalActions: number;
    confirmedRate: number;
    failedRate: number;
    avgLatency: number;
  };
}> {
  const now = new Date();
  const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [thisWeek, lastWeek] = await Promise.all([
    computeReliabilityMetrics({ userId, dateFrom: thisWeekStart, dateTo: now.toISOString().split("T")[0] }),
    computeReliabilityMetrics({ userId, dateFrom: lastWeekStart, dateTo: lastWeekEnd }),
  ]);

  return {
    thisWeek,
    lastWeek,
    changes: {
      totalActions: thisWeek.totalActions - lastWeek.totalActions,
      confirmedRate: Math.round((thisWeek.confirmedRate - lastWeek.confirmedRate) * 10) / 10,
      failedRate: Math.round((thisWeek.failedRate - lastWeek.failedRate) * 10) / 10,
      avgLatency: Math.round(thisWeek.averageLatencyMs - lastWeek.averageLatencyMs),
    },
  };
}