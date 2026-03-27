import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuthenticatedUser, isAuthError } from '@/lib/auth/require-user';
import { encryptValue } from '@/lib/encryption';

const ALLOWED_KEY_NAMES = new Set(['gemini', 'brevo']);

function formatAuditTimestamp(): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Johannesburg',
  }).format(new Date());
}

// GET /api/office/api-keys — returns metadata only (never the decrypted key)
export async function GET() {
  try {
    const { supabase } = await requireAuthenticatedUser();

    const { data: keys, error: keysError } = await supabase
      .from('api_keys')
      .select('key_name, last_updated_at')
      .in('key_name', Array.from(ALLOWED_KEY_NAMES));

    if (keysError) {
      return NextResponse.json({ error: keysError.message }, { status: 500 });
    }

    const { data: logs, error: logsError } = await supabase
      .from('api_key_audit_log')
      .select('key_name, action, performed_at')
      .in('key_name', Array.from(ALLOWED_KEY_NAMES))
      .order('performed_at', { ascending: false })
      .limit(50);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({ keys: keys ?? [], logs: logs ?? [] });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to fetch API key metadata' }, { status: 500 });
  }
}

// POST /api/office/api-keys — save (add or update) an encrypted key
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const { keyName, keyValue } = await request.json();

    if (!ALLOWED_KEY_NAMES.has(keyName)) {
      return NextResponse.json({ error: 'Invalid key name' }, { status: 400 });
    }

    if (!keyValue || typeof keyValue !== 'string' || keyValue.trim().length < 10) {
      return NextResponse.json({ error: 'Invalid key value' }, { status: 400 });
    }

    if (!process.env.ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: 'ENCRYPTION_KEY is not configured. Contact your administrator.' },
        { status: 503 }
      );
    }

    const { encryptedHex, ivHex } = await encryptValue(keyValue.trim());
    const now = new Date().toISOString();

    // Check if key already exists — if so, this is an update
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id')
      .eq('key_name', keyName)
      .maybeSingle();

    const action = existing ? 'updated' : 'added';

    const upsertPayload = {
      key_name: keyName,
      encrypted_value: encryptedHex,
      iv: ivHex,
      last_updated_at: now,
    };

    const { error: upsertError } = await supabase
      .from('api_keys')
      .upsert(upsertPayload, { onConflict: 'key_name' });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Audit log
    const keyLabel = keyName === 'gemini' ? 'Gemini API' : 'Brevo API';
    await supabase.from('api_key_audit_log').insert({
      key_name: keyName,
      action,
      performed_at: now,
      performed_by: 'Thabo',
    });

    return NextResponse.json({
      success: true,
      message: `${keyLabel} key ${action} — ${formatAuditTimestamp()}`,
    });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to save API key' }, { status: 500 });
  }
}

// DELETE /api/office/api-keys — remove a stored key
export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const { keyName } = await request.json();

    if (!ALLOWED_KEY_NAMES.has(keyName)) {
      return NextResponse.json({ error: 'Invalid key name' }, { status: 400 });
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('key_name', keyName);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await supabase.from('api_key_audit_log').insert({
      key_name: keyName,
      action: 'removed',
      performed_at: new Date().toISOString(),
      performed_by: 'Thabo',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to remove API key' }, { status: 500 });
  }
}
