import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, isAuthError } from '@/lib/auth/require-user';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/office/assistant-conversations
 * Returns the most recent active conversation with its messages,
 * or a list of recent conversations if ?list=1 is passed.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    const userId = authResult.user.id;
    const supabase = createAdminClient();

    const url = new URL(req.url);
    const listMode = url.searchParams.get('list') === '1';
    const conversationId = url.searchParams.get('id');

    if (listMode) {
      // Return list of recent conversations
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ conversations: data || [] });
    }

    if (conversationId) {
      // Return specific conversation with messages
      const { data: conv, error: convError } = await supabase
        .from('ai_conversations')
        .select('id, title, created_at, updated_at')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (convError || !conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      const { data: messages, error: msgError } = await supabase
        .from('ai_conversation_messages')
        .select('id, role, content, tool_name, structured_status, metadata, created_at')
        .eq('conversation_id', conversationId)
        .order('message_order', { ascending: true });

      if (msgError) {
        return NextResponse.json({ error: msgError }, { status: 500 });
      }

      return NextResponse.json({
        conversation: conv,
        messages: messages || [],
      });
    }

    // Default: return most recent active conversation with messages
    const { data: recentConv, error: convError } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    if (!recentConv) {
      return NextResponse.json({ conversation: null, messages: [] });
    }

    const { data: messages, error: msgError } = await supabase
      .from('ai_conversation_messages')
      .select('id, role, content, tool_name, structured_status, metadata, created_at')
      .eq('conversation_id', recentConv.id)
      .order('message_order', { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    return NextResponse.json({
      conversation: recentConv,
      messages: messages || [],
    });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Failed to load assistant conversations:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/office/assistant-conversations
 * Creates a new conversation or saves messages to an existing one.
 * 
 * Body:
 * {
 *   action: 'create' | 'save_messages',
 *   conversation_id?: string,  // required for save_messages
 *   title?: string,            // for create
 *   messages?: Array<{         // for save_messages
 *     role: 'user' | 'assistant' | 'system' | 'tool',
 *     content: string,
 *     tool_name?: string,
 *     structured_status?: object,
 *     metadata?: object,
 *   }>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    const userId = authResult.user.id;
    const supabase = createAdminClient();

    const body = await req.json();
    const { action, conversation_id, title, messages } = body;

    if (action === 'create') {
      // Auto-generate title from first message if not provided
      const firstUserMsg = messages?.find((m: any) => m.role === 'user');
      const autoTitle = title || (firstUserMsg?.content
        ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
        : 'New Conversation');

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: autoTitle,
          source: 'chat',
        })
        .select('id, title, created_at')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ conversation: data });
    }

    if (action === 'save_messages') {
      if (!conversation_id || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: 'conversation_id and messages are required for save_messages' },
          { status: 400 }
        );
      }

      // Verify conversation belongs to user
      const { data: conv, error: convError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('id', conversation_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (convError || !conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Get current max message_order to avoid duplicates
      const { data: maxOrder } = await supabase
        .from('ai_conversation_messages')
        .select('message_order')
        .eq('conversation_id', conversation_id)
        .order('message_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextOrder = (maxOrder?.message_order ?? -1) + 1;

      // Insert messages
      const messageRows = messages.map((msg: any) => ({
        conversation_id,
        role: msg.role || 'user',
        content: msg.content || '',
        message_order: nextOrder++,
        tool_name: msg.tool_name || null,
        structured_status: msg.structured_status || null,
        metadata: msg.metadata || {},
      }));

      if (messageRows.length > 0) {
        const { error: insertError } = await supabase
          .from('ai_conversation_messages')
          .insert(messageRows);

        if (insertError) {
          console.error('Failed to save conversation messages:', insertError);
          // Don't fail the request - messages are secondary
        }
      }

      // Update conversation updated_at
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation_id);

      return NextResponse.json({ success: true, message_count: messageRows.length });
    }

    if (action === 'archive') {
      if (!conversation_id) {
        return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('ai_conversations')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', conversation_id)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Failed to save assistant conversation:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}