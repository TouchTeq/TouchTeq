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
    const result = await runOfficeSequences(supabase);
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
