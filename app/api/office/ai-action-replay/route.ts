import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { replayAction, getToolSafetyConfig } from '@/lib/ai/action-replay';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const actionId = searchParams.get('id');

  if (!actionId) {
    return NextResponse.json({ error: 'Missing action ID' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch the action log with full details
  const { data: actionLog, error } = await supabase
    .from('ai_action_log')
    .select('*')
    .eq('id', actionId)
    .single();

  if (error || !actionLog) {
    return NextResponse.json({ error: 'Action log not found' }, { status: 404 });
  }

  // Fetch conversation context
  let conversationContext = null;
  if (actionLog.conversation_id) {
    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', actionLog.conversation_id)
      .single();

    if (conv) {
      const { data: messages } = await supabase
        .from('ai_conversation_messages')
        .select('role, content, tool_name, message_order, structured_status')
        .eq('conversation_id', actionLog.conversation_id)
        .order('message_order', { ascending: true })
        .limit(50);

      conversationContext = { conversation: conv, messages: messages || [] };
    }
  }

  // Get safety config
  const safetyConfig = getToolSafetyConfig(actionLog.tool_name);

  return NextResponse.json({
    actionLog,
    conversationContext,
    safetyConfig,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionId, forceReplay } = body;

    if (!actionId) {
      return NextResponse.json({ error: 'Missing action ID' }, { status: 400 });
    }

    const result = await replayAction(actionId, Boolean(forceReplay));

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Replay failed' },
      { status: 500 }
    );
  }
}
