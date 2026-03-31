import { NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/brevo/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { name, email, company, source, token } = await request.json();

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && token) {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(token)}`,
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json(
          { error: 'Submission could not be verified. Please try again.' },
          { status: 400 }
        );
      }
    } else if (turnstileSecret && !token) {
      return NextResponse.json(
        { error: 'Submission could not be verified. Please try again.' },
        { status: 400 }
      );
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listIdStr = process.env.BREVO_LIST_ID;

    if (!apiKey || !listIdStr) {
      return NextResponse.json(
        { error: 'Newsletter signup is not configured on this environment.' },
        { status: 503 }
      );
    }

    const listId = parseInt(listIdStr, 10);
    if (Number.isNaN(listId)) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const attributes: Record<string, string> = { FIRSTNAME: name };
    if (company) attributes.COMPANY = company;
    if (source) attributes.SOURCE = source;

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      const supabase = await createClient();
      const { data: profile } = await supabase.from('business_profile').select('email, accounts_email').single();
      const recipientEmail = profile?.email || profile?.accounts_email || process.env.SALES_EMAIL || 'sales@touchteq.co.za';
      const sourceLabel = source || 'Website';

      await sendTransactionalEmail({
        to: [{ email: recipientEmail, name: 'Touch Teq Sales' }],
        subject: `New ${sourceLabel} signup: ${name}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; color: #334155; max-width: 680px; margin: 0 auto;">
            <p style="font-size: 12px; font-weight: bold; color: #f97316; text-transform: uppercase; letter-spacing: 1px;">${sourceLabel} Signup</p>
            <h1 style="color: #0f172a;">New subscriber</h1>
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Name</td><td style="padding: 6px 0; color: #0f172a;">${name}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Email</td><td style="padding: 6px 0; color: #0f172a;">${email}</td></tr>
              ${company ? `<tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Company</td><td style="padding: 6px 0; color: #0f172a;">${company}</td></tr>` : ''}
              <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Source</td><td style="padding: 6px 0; color: #0f172a;">${sourceLabel}</td></tr>
            </table>
          </div>
        `,
        replyTo: {
          email: String(email),
          name: String(name),
        },
      });

      return NextResponse.json({ message: 'Subscribed successfully.' }, { status: 201 });
    }

    const data = await response.json();

    if (data.code === 'duplicate_parameter') {
      return NextResponse.json(
        { error: 'This email is already subscribed.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: data.message || 'Error communicating with newsletter service.' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
