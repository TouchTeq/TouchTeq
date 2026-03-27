import { NextResponse } from 'next/server';
import { isAuthError, requireAuthenticatedUser } from '@/lib/auth/require-user';
import { sendDocumentEmail, sendFreeformOfficeEmail, type DocumentEmailType } from '@/lib/office/outbound-email';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();

    const {
      recipientEmail,
      recipientName,
      subject,
      htmlBody,
      documentType,
      documentReference,
    } = await request.json();

    if (!recipientEmail || !subject || !htmlBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedType =
      documentType === 'invoice' || documentType === 'quotation'
        ? (documentType as DocumentEmailType)
        : null;

    if (normalizedType && documentReference) {
      const result = await sendDocumentEmail({
        supabase,
        documentType: normalizedType,
        documentReference,
        recipientEmail,
        recipientName,
        subjectOverride: subject,
        htmlBodyOverride: htmlBody,
      });

      return NextResponse.json({ success: true, reference: result.reference });
    }

    await sendFreeformOfficeEmail({
      supabase,
      recipientEmail,
      recipientName,
      subject,
      htmlBody,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error?.message || 'Unable to send email' },
      { status: 500 }
    );
  }
}
