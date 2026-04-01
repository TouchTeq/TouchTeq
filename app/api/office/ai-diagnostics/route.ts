import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, isAuthError } from '@/lib/auth/require-user';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/office/ai-diagnostics
 * Returns aggregated diagnostics data for the AI assistant.
 * 
 * Query params:
 * - dateFrom: YYYY-MM-DD
 * - dateTo: YYYY-MM-DD
 * - status: confirmed|failed|could_not_verify|unsupported|need_info|attempted
 * - toolName: specific tool name
 * - errorType: specific error type
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
    const errorTypeFilter = url.searchParams.get('errorType') || null;

    // Build date filter
    let dateFilter = '';
    if (dateFrom) dateFilter += ` AND created_at >= '${dateFrom}T00:00:00'`;
    if (dateTo) dateFilter += ` AND created_at <= '${dateTo}T23:59:59'`;

    // Build status filter
    let statusFilterClause = '';
    if (statusFilter) {
      statusFilterClause = ` AND structured_status->>'status' = '${statusFilter}'`;
    }

    // Build tool name filter
    let toolNameFilterClause = '';
    if (toolNameFilter) {
      toolNameFilterClause = ` AND tool_name = '${toolNameFilter}'`;
    }

    // Build error type filter
    let errorTypeFilterClause = '';
    if (errorTypeFilter) {
      errorTypeFilterClause = ` AND structured_status->>'error' IS NOT NULL`;
    }

    const whereClause = `user_id = '${userId}'${dateFilter}${statusFilterClause}${toolNameFilterClause}${errorTypeFilterClause}`;

    // 1. Summary counts
    const { data: allActions } = await supabase
      .from('ai_action_logs')
      .select('structured_status, tool_name, target_reference, error_message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const actions = allActions || [];
    
    // Apply client-side filters for structured_status fields
    const filteredActions = actions.filter((a: any) => {
      const status = a.structured_status?.status;
      const error = a.structured_status?.error;
      if (statusFilter && status !== statusFilter) return false;
      if (toolNameFilter && a.tool_name !== toolNameFilter) return false;
      if (errorTypeFilter && !error) return false;
      if (dateFrom && a.created_at < `${dateFrom}T00:00:00`) return false;
      if (dateTo && a.created_at > `${dateTo}T23:59:59`) return false;
      return true;
    });

    const summary = {
      totalActions: filteredActions.length,
      confirmed: filteredActions.filter((a: any) => a.structured_status?.status === 'confirmed').length,
      failed: filteredActions.filter((a: any) => a.structured_status?.status === 'failed').length,
      couldNotVerify: filteredActions.filter((a: any) => a.structured_status?.status === 'could_not_verify').length,
      unsupported: filteredActions.filter((a: any) => a.structured_status?.status === 'unsupported').length,
      needInfo: filteredActions.filter((a: any) => a.structured_status?.status === 'need_info').length,
      attempted: filteredActions.filter((a: any) => a.structured_status?.status === 'attempted').length,
      ambiguousMatches: filteredActions.filter((a: any) => 
        a.error_message?.includes('Multiple') || a.error_message?.includes('ambiguous')
      ).length,
    };

    // 2. Tool usage frequency
    const toolUsage: Record<string, number> = {};
    filteredActions.forEach((a: any) => {
      const tool = a.tool_name || 'unknown';
      toolUsage[tool] = (toolUsage[tool] || 0) + 1;
    });
    const toolUsageSorted = Object.entries(toolUsage)
      .sort(([, a], [, b]) => b - a)
      .map(([tool, count]) => ({ tool, count }));

    // 3. Recent action logs (last 100)
    const recentActions = filteredActions.slice(0, 100).map((a: any) => ({
      id: a.id,
      timestamp: a.created_at,
      userMessage: (a.user_message || '').slice(0, 100),
      toolName: a.tool_name,
      targetReference: a.target_reference,
      status: a.structured_status?.status || 'unknown',
      verified: a.structured_status?.verified || false,
      errorType: a.structured_status?.error ? 'error' : null,
      errorMessage: a.structured_status?.error || a.error_message,
      summary: a.structured_status?.summary,
      nextStep: a.structured_status?.nextStep,
      rawStatus: a.structured_status,
    }));

    // 4. Failed actions detail
    const failedActions = filteredActions
      .filter((a: any) => ['failed', 'could_not_verify', 'unsupported', 'need_info'].includes(a.structured_status?.status))
      .slice(0, 50)
      .map((a: any) => ({
        id: a.id,
        timestamp: a.created_at,
        userMessage: a.user_message,
        toolName: a.tool_name,
        targetReference: a.target_reference,
        status: a.structured_status?.status,
        error: a.structured_status?.error || a.error_message,
        nextStep: a.structured_status?.nextStep,
        summary: a.structured_status?.summary,
        rawStatus: a.structured_status,
        rawToolResult: a.raw_tool_result,
      }));

    // 5. Recent conversations
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(20);

    // 6. Most common unsupported requests
    const unsupportedActions = filteredActions.filter((a: any) => a.structured_status?.status === 'unsupported');
    const unsupportedByTool: Record<string, number> = {};
    unsupportedActions.forEach((a: any) => {
      const tool = a.tool_name || 'unknown';
      unsupportedByTool[tool] = (unsupportedByTool[tool] || 0) + 1;
    });
    const unsupportedSorted = Object.entries(unsupportedByTool)
      .sort(([, a], [, b]) => b - a)
      .map(([tool, count]) => ({ tool, count }));

    // 7. Actions by status over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const actionsByDay: Record<string, Record<string, number>> = {};
    
    filteredActions.forEach((a: any) => {
      const date = new Date(a.created_at);
      if (date < sevenDaysAgo) return;
      const dayKey = date.toISOString().split('T')[0];
      if (!actionsByDay[dayKey]) {
        actionsByDay[dayKey] = { confirmed: 0, failed: 0, could_not_verify: 0, unsupported: 0, need_info: 0, attempted: 0 };
      }
      const status = a.structured_status?.status || 'unknown';
      if (actionsByDay[dayKey][status] !== undefined) {
        actionsByDay[dayKey][status]++;
      }
    });
    
    const actionsByDaySorted = Object.entries(actionsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return NextResponse.json({
      summary,
      toolUsage: toolUsageSorted,
      recentActions,
      failedActions,
      conversations: conversations || [],
      unsupportedByTool: unsupportedSorted,
      actionsByDay: actionsByDaySorted,
    });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Failed to load AI diagnostics:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}