import { NextRequest, NextResponse } from 'next/server';
import { addContactToBrevo, sendTransactionalEmail } from '@/lib/brevo/client';
import { requireAuthenticatedUser, isAuthError } from '@/lib/auth/require-user';

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedUser();

    const { name, company, email, resourceName, turnstileToken } = await request.json();

    if (!name || !email || !resourceName) {
      return NextResponse.json(
        { error: 'Name, email, and resource are required' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Only verify Turnstile if both secret key and token are present
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && turnstileToken && turnstileToken !== '') {
      try {
        const turnstileResponse = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${turnstileSecret}&response=${turnstileToken}`,
          }
        );
        const turnstileData = await turnstileResponse.json();
        if (!turnstileData.success) {
          console.warn('Turnstile verification failed, proceeding anyway:', turnstileData);
        }
      } catch (turnstileError) {
        console.warn('Turnstile verification error, proceeding anyway:', turnstileError);
      }
    }

    const result = await addContactToBrevo({
      email,
      name,
      company,
      tags: [`SOURCE: Resource Download`, `Resource: ${resourceName}`]
    });

    if (!result.success) {
      console.error('Brevo contact addition failed:', result.error);
    }

    const resourceMap: { [key: string]: string } = {
      'HAC Checklist': '/downloads/HAC_Checklist.docx',
      'Fire & Gas Audit Checklist': '/downloads/FG_Audit_Checklist.docx',
      'Engineering Standards Reference': '/downloads/Standards_Reference_Sheet.docx'
    };

    const downloadUrl = resourceMap[resourceName] || '/downloads/HAC_Checklist.docx';

    const recipientEmail = process.env.SALES_EMAIL || 'sales@touchteq.co.za';

    await sendTransactionalEmail({
      to: [{ email: recipientEmail, name: 'Touch Teq Sales' }],
      subject: `Resource Download: ${resourceName}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #334155; max-width: 680px; margin: 0 auto;">
          <p style="font-size: 12px; font-weight: bold; color: #f97316; text-transform: uppercase; letter-spacing: 1px;">Resource Download</p>
          <h1 style="color: #0f172a;">Someone downloaded "${resourceName}"</h1>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Name</td><td style="padding: 6px 0; color: #0f172a;">${name}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Email</td><td style="padding: 6px 0; color: #0f172a;">${email}</td></tr>
            ${company ? `<tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Company</td><td style="padding: 6px 0; color: #0f172a;">${company}</td></tr>` : ''}
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">Resource</td><td style="padding: 6px 0; color: #0f172a;">${resourceName}</td></tr>
          </table>
        </div>
      `,
      replyTo: {
        email: String(email),
        name: String(name),
      },
    });

    return NextResponse.json({
      success: true,
      downloadUrl
    });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Download API Error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
