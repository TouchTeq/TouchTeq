import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runOfficeSequences } from '@/lib/office/maintenance';

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('CRON_SECRET is not configured.');
  }

  const authorization = request.headers.get('authorization') || '';
  return authorization === secret || authorization === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const startTime = Date.now();

    // Idempotency guard: skip if already run within the last 23 hours
    const { data: lastRun } = await supabase
      .from('cron_log')
      .select('ran_at')
      .order('ran_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastRun && new Date(lastRun.ran_at) > new Date(Date.now() - 23 * 60 * 60 * 1000)) {
      return NextResponse.json({
        skipped: true,
        reason: 'Already ran within 23 hours',
        lastRun: lastRun.ran_at,
      });
    }

    const result = await runOfficeSequences(supabase);
    const durationMs = Date.now() - startTime;

    await supabase
      .from("ai_rate_limits")
      .delete()
      .lt("window_start", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

    const ranAt = new Date().toISOString();

    const { data: profile } = await supabase
      .from('business_profile')
      .select('id, document_settings')
      .limit(1)
      .maybeSingle();

    if (profile?.id) {
      const documentSettings = (profile.document_settings && typeof profile.document_settings === 'object')
        ? profile.document_settings as Record<string, any>
        : {};
      const notificationPreferences =
        documentSettings.notification_preferences && typeof documentSettings.notification_preferences === 'object'
          ? documentSettings.notification_preferences as Record<string, any>
          : {};

      const nextDocumentSettings = {
        ...documentSettings,
        notification_preferences: {
          ...notificationPreferences,
          cron_last_summary: {
            ran_at: ranAt,
            reminders_sent: result.remindersSent || 0,
            invoices_marked_overdue: result.invoicesMarkedOverdue || 0,
            quotes_expired: result.quotesExpired || 0,
          },
        },
      };

      await supabase
        .from('business_profile')
        .update({ document_settings: nextDocumentSettings })
        .eq('id', profile.id);
    }

    // Log this run to cron_log for idempotency tracking
    await supabase.from('cron_log').insert({
      ran_at: ranAt,
      result: { ...result },
      duration_ms: durationMs,
    });

    return NextResponse.json({
      ok: true,
      ranAt,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to run office sequences' },
      { status: 500 }
    );
  }
}
