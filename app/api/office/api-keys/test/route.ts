import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuthenticatedUser, isAuthError } from '@/lib/auth/require-user';
import { getActiveApiKey } from '@/lib/api-keys/resolver';

// POST /api/office/api-keys/test — test that a stored or provided key works
export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedUser();
    const { keyName, dryRunValue } = await request.json();

    if (!['gemini', 'brevo'].includes(keyName)) {
      return NextResponse.json({ error: 'Invalid key name' }, { status: 400 });
    }

    // Use a dry-run value (freshly typed, not yet saved) or the stored/env key
    const keyToTest = dryRunValue?.trim() || (await getActiveApiKey(keyName));

    if (!keyToTest) {
      return NextResponse.json({ success: false, error: 'No API key is configured' }, { status: 200 });
    }

    if (keyName === 'gemini') {
      return await testGeminiKey(keyToTest);
    }

    if (keyName === 'brevo') {
      return await testBrevoKey(keyToTest);
    }

    return NextResponse.json({ error: 'Unknown key type' }, { status: 400 });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Test failed' }, { status: 500 });
  }
}

async function testGeminiKey(apiKey: string) {
  try {
    // Lightweight test: list models endpoint
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (res.ok) {
      return NextResponse.json({ success: true, message: '✅ Connected — Gemini API is working' });
    }

    const errBody = await res.json().catch(() => ({}));
    const reason = errBody?.error?.message || `HTTP ${res.status}`;
    return NextResponse.json({
      success: false,
      message: `❌ Invalid key — ${reason}`,
    });
  } catch {
    return NextResponse.json({ success: false, message: '❌ Connection failed — check your network' });
  }
}

async function testBrevoKey(apiKey: string) {
  try {
    // Send a test email to info@touchteq.co.za
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Touch Teq Office', email: 'info@touchteq.co.za' },
        to: [{ email: 'info@touchteq.co.za', name: 'Touch Teq' }],
        subject: 'Brevo Connection Test — Touch Teq Office',
        htmlContent:
          '<p>This is an automated connection test from Touch Teq Office Settings. Your Brevo API key is working correctly.</p>',
      }),
    });

    if (res.ok || res.status === 201) {
      return NextResponse.json({ success: true, message: '✅ Connected — Test email sent to info@touchteq.co.za' });
    }

    const errBody = await res.json().catch(() => ({}));
    const reason = errBody?.message || `HTTP ${res.status}`;
    return NextResponse.json({
      success: false,
      message: `❌ Invalid key — ${reason}`,
    });
  } catch {
    return NextResponse.json({ success: false, message: '❌ Connection failed — check your network' });
  }
}
