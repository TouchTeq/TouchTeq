import { NextResponse } from 'next/server';
import { isAuthError, requireAuthenticatedUser } from '@/lib/auth/require-user';
import { processReminderSequence } from '@/lib/office/maintenance';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    let body: Record<string, any> = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const results = await processReminderSequence(supabase, body);

    return NextResponse.json({ results });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error?.message || 'Unable to process reminders' },
      { status: 500 }
    );
  }
}
