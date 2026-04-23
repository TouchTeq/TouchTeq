import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuthenticatedUser } from '@/lib/auth/require-user';
import AiLogClient from './AiLogClient';

export const dynamic = 'force-dynamic';

export default async function AiLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; tool?: string }>;
}) {
  const { user } = await requireAuthenticatedUser();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || '1', 10));
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  const supabase = createAdminClient();

  let query = supabase
    .from('ai_action_log')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.status && params.status !== 'all') {
    query = query.eq('action_status', params.status);
  }

  if (params.tool && params.tool !== 'all') {
    query = query.eq('tool_name', params.tool);
  }

  const { data: logs, count } = await query;

  // Get distinct tool names for filter dropdown
  const { data: toolNames } = await supabase
    .from('ai_action_log')
    .select('tool_name')
    .eq('user_id', user.id)
    .order('tool_name');

  const uniqueTools = [...new Set((toolNames || []).map((r: any) => r.tool_name))].sort();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AiLogClient
        logs={logs || []}
        totalCount={count || 0}
        page={page}
        pageSize={pageSize}
        toolNames={uniqueTools}
        activeStatus={params.status || 'all'}
        activeTool={params.tool || 'all'}
      />
    </Suspense>
  );
}
