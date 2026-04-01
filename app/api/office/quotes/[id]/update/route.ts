import { NextResponse } from 'next/server';
import { updateQuoteWithItems } from '@/lib/office/document-updates';
import { validateLineItems, formatValidationErrors } from '@/lib/office/line-item-validation';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Quote id is required.' }, { status: 400 });
    }

    const {
      client_id,
      issue_date,
      expiry_date,
      status,
      notes,
      internal_notes,
      line_items,
    } = body || {};

    if (!client_id) {
      return NextResponse.json({ success: false, error: 'Client id is required.' }, { status: 400 });
    }

    if (!issue_date || !expiry_date) {
      return NextResponse.json({ success: false, error: 'Issue date and expiry date are required.' }, { status: 400 });
    }

    const validation = validateLineItems(line_items || []);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: formatValidationErrors(validation.errors) }, { status: 400 });
    }

    const { quote, lineItems } = await updateQuoteWithItems({
      quoteId: id,
      clientId: client_id,
      issue_date,
      expiry_date,
      status: status || 'Draft',
      notes,
      internal_notes,
      line_items: validation.items,
    });

    return NextResponse.json({ success: true, quote, lineItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Quote update failed.' },
      { status: 500 }
    );
  }
}
