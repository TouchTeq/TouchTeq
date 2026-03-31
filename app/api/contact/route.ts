import { NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/brevo/client';
import { escapeHtml } from '@/lib/office/outbound-email';
import { createClient } from '@/lib/supabase/server';

function renderLine(label: string, value: string) {
  return `<tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">${escapeHtml(label)}</td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(value)}</td></tr>`;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { token, fullName, companyName, email, mobileNumber, officeNumber, extension, service, timeline, message } = data;

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

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'Contact handling is not configured on this environment yet.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: profile } = await supabase.from('business_profile').select('email, accounts_email').single();
    const recipientEmail = profile?.email || profile?.accounts_email || process.env.SALES_EMAIL || 'sales@touchteq.co.za';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #334155; max-width: 680px; margin: 0 auto;">
        <p style="font-size: 12px; font-weight: bold; color: #f97316; text-transform: uppercase; letter-spacing: 1px;">Website Contact Submission</p>
        <h1 style="color: #0f172a;">New inquiry from ${escapeHtml(fullName)}</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          ${renderLine('Full name', String(fullName))}
          ${companyName ? renderLine('Company', String(companyName)) : ''}
          ${renderLine('Email', String(email))}
          ${mobileNumber ? renderLine('Mobile', String(mobileNumber)) : ''}
          ${officeNumber ? renderLine('Office', String(officeNumber)) : ''}
          ${extension ? renderLine('Extension', String(extension)) : ''}
          ${service ? renderLine('Service', String(service)) : ''}
          ${timeline ? renderLine('Timeline', String(timeline)) : ''}
        </table>
        <div style="padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <p style="margin-top: 0; font-weight: bold; color: #0f172a;">Message</p>
          <p style="margin-bottom: 0; white-space: pre-wrap;">${escapeHtml(String(message))}</p>
        </div>
      </div>
    `;

    const emailResult = await sendTransactionalEmail({
      to: [{ email: recipientEmail, name: 'Touch Teq Sales' }],
      subject: `Website enquiry from ${fullName}`,
      htmlContent,
      replyTo: {
        email: String(email),
        name: String(fullName),
      },
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Unable to send your message right now.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Message sent successfully.' }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
