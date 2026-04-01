import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, isAuthError } from '@/lib/auth/require-user';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeReliabilityMetrics, AIReliabilityMetrics } from '@/lib/ai/metrics';

/**
 * GET /api/office/ai-diagnostics
 * Returns aggregated diagnostics data for the AI assistant.
 * 
 * Query params:
 * - dateFrom: YYYY-MM-DD
 * - dateTo: YYYY-MM-DD
 * - status: confirmed|failed|could_not_verify|unsupported|need_info|attempted
 * - toolName: specific tool name
 * - includeMetrics: 'true' to include computed reliability metrics (default: true)
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    const userId = authResult.user.id;
    const supabase = createAdminClient();

    const url = new URL(req.url);
    const dateFrom = url.searchParams.get('dateFrom') || null;
    const dateTo = url.searchParams.get('dateTo') || null;
    const statusFilter = url.searchParams.get('status') || null;
    const toolNameFilter = url.searchParams.get('toolName') || null;
    const includeMetrics = url.searchParams.get('includeMetrics') !== 'false';

    // Fetch raw action logs for basic data
    let query = supabase
      .from('ai_action_log')
      .select('id, action_status, tool_name, target_reference, error_message, created_at, user_message, raw_tool_result, verified, attempted, summary, next_step, latency_ms')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('action_status', statusFilter);
    if (toolNameFilter) query = query.eq('tool_name', toolNameFilter);

    const { data: allActions } = await query;
    const actions = allActions || [];

    // Client-side date filtering
    const filteredActions = actions.filter((a: any) => {
      if (dateFrom && a.created_at < `${dateFrom}T00:00:00`) return false;
      if (dateTo && a.created_at > `${dateTo}T23:59:59`) return false;
      return true;
    });

    // Basic summary (from existing logic)
    const summary = {
      totalActions: filteredActions.length,
      confirmed: filteredActions.filter((a: any) => a.action_status === 'confirmed').length,
      failed: filteredActions.filter((a: any) => a.action_status === 'failed').length,
      couldNotVerify: filteredActions.filter((a: any) => a.action_status === 'could_not_verify').length,
      unsupported: filteredActions.filter((a: any) => a.action_status === 'unsupported').length,
      needInfo: filteredActions.filter((a: any) => a.action_status === 'need_info').length,
      attempted: filteredActions.filter((a: any) => a.action_status === 'attempted').length,
      ambiguousMatches: filteredActions.filter((a: any) =>
        a.error_message?.includes('Multiple') || a.error_message?.includes('ambiguous')
      ).length,
    };

    // Tool usage
    const toolUsage: Record<string, number> = {};
    filteredActions.forEach((a: any) => {
      const tool = a.tool_name || 'unknown';
      toolUsage[tool] = (toolUsage[tool] || 0) + 1;
    });
    const toolUsageSorted = Object.entries(toolUsage)
      .sort(([, a], [, b]) => b - a)
      .map(([tool, count]) => ({ tool, count }));

    // Recent actions
    const recentActions = filteredActions.slice(0, 100).map((a: any) => ({
      id: a.id,
      timestamp: a.created_at,
      userMessage: (a.user_message || '').slice(0, 100),
      toolName: a.tool_name,
      targetReference: a.target_reference,
      status: a.action_status || 'unknown',
      verified: a.verified || false,
      attempted: a.attempted || false,
      errorType: a.error_message ? 'error' : null,
      errorMessage: a.error_message,
      summary: a.summary,
      nextStep: a.next_step,
      latencyMs: a.latency_ms,
      rawStatus: {
        status: a.action_status,
        verified: a.verified,
        attempted: a.attempted,
        error: a.error_message,
        summary: a.summary,
        nextStep: a.next_step,
      },
    }));

    // Failed actions
    const failedActions = filteredActions
      .filter((a: any) => ['failed', 'could_not_verify', 'unsupported', 'need_info'].includes(a.action_status))
      .slice(0, 50)
      .map((a: any) => ({
        id: a.id,
        timestamp: a.created_at,
        userMessage: a.user_message,
        toolName: a.tool_name,
        targetReference: a.target_reference,
        status: a.action_status,
        error: a.error_message,
        nextStep: a.next_step,
        summary: a.summary,
        latencyMs: a.latency_ms,
        rawStatus: {
          status: a.action_status,
          verified: a.verified,
          attempted: a.attempted,
          error: a.error_message,
          summary: a.summary,
          nextStep: a.next_step,
        },
        rawToolResult: a.raw_tool_result,
      }));

    // Conversations
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(20);

    // Unsupported by tool
    const unsupportedActions = filteredActions.filter((a: any) => a.action_status === 'unsupported');
    const unsupportedByTool: Record<string, number> = {};
    unsupportedActions.forEach((a: any) => {
      const tool = a.tool_name || 'unknown';
      unsupportedByTool[tool] = (unsupportedByTool[tool] || 0) + 1;
    });
    const unsupportedSorted = Object.entries(unsupportedByTool)
      .sort(([, a], [, b]) => b - a)
      .map(([tool, count]) => ({ tool, count }));

    // Actions by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const actionsByDay: Record<string, Record<string, number>> = {};
    
    filteredActions.forEach((a: any) => {
      const date = new Date(a.created_at);
      if (date < thirtyDaysAgo) return;
      const dayKey = date.toISOString().split('T')[0];
      if (!actionsByDay[dayKey]) {
        actionsByDay[dayKey] = { confirmed: 0, failed: 0, could_not_verify: 0, unsupported: 0, need_info: 0, attempted: 0 };
      }
      const status = a.action_status || 'unknown';
      if (actionsByDay[dayKey][status] !== undefined) {
        actionsByDay[dayKey][status]++;
      }
    });
    
    const actionsByDaySorted = Object.entries(actionsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    // Build response
    const response: any = {
      summary,
      toolUsage: toolUsageSorted,
      recentActions,
      failedActions,
      conversations: conversations || [],
      unsupportedByTool: unsupportedSorted,
      actionsByDay: actionsByDaySorted,
    };

    // Compute reliability metrics if requested
    if (includeMetrics && filteredActions.length > 0) {
      try {
        const metrics = await computeReliabilityMetrics({
          userId,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        response.reliabilityMetrics = metrics;
      } catch (metricsError) {
        console.error('Failed to compute reliability metrics:', metricsError);
        // Don't fail the whole request, just skip metrics
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Failed to load AI diagnostics:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}