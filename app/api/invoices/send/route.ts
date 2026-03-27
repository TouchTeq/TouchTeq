import { NextResponse } from 'next/server';
import { isAuthError, requireAuthenticatedUser } from '@/lib/auth/require-user';
import { sendDocumentEmail } from '@/lib/office/outbound-email';

export async function POST(request: Request) {
  try {
    const {
      invoiceId,
      recipientEmail,
      recipientName,
      invoiceNumber,
      personalMessage,
      pdfContent,
    } = await request.json();

    if (!invoiceId || !pdfContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { supabase } = await requireAuthenticatedUser();

    const result = await sendDocumentEmail({
      supabase,
      documentType: 'invoice',
      documentId: invoiceId,
      documentReference: invoiceNumber,
      recipientEmail,
      recipientName,
      personalMessage,
      attachmentBase64: pdfContent,
    });

    return NextResponse.json({ success: true, reference: result.reference });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error?.message || 'Unable to send invoice email' },
      { status: 500 }
    );
  }
}
