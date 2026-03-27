import { NextResponse } from 'next/server';
import { isAuthError, requireAuthenticatedUser } from '@/lib/auth/require-user';
import { sendDocumentEmail } from '@/lib/office/outbound-email';

export async function POST(request: Request) {
  try {
    const {
      quoteId,
      recipientEmail,
      recipientName,
      quoteNumber,
      personalMessage,
      pdfContent,
    } = await request.json();

    if (!quoteId || !pdfContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { supabase } = await requireAuthenticatedUser();

    const result = await sendDocumentEmail({
      supabase,
      documentType: 'quotation',
      documentId: quoteId,
      documentReference: quoteNumber,
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
      { error: error?.message || 'Unable to send quotation email' },
      { status: 500 }
    );
  }
}
