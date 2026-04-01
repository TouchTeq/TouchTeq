import { NextResponse } from 'next/server';
import { updateCreditNoteWithItems } from '@/lib/office/document-updates';
import { validateLineItems, formatValidationErrors } from '@/lib/office/line-item-validation';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Credit note id is required.' }, { status: 400 });
    }

    const { client_id, issue_date, status, reason, notes, line_items, invoice_id } = body || {};

    if (!client_id) {
      return NextResponse.json({ success: false, error: 'Client id is required.' }, { status: 400 });
    }

    if (!issue_date) {
      return NextResponse.json({ success: false, error: 'Issue date is required.' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ success: false, error: 'Reason is required.' }, { status: 400 });
    }

    const validation = validateLineItems(line_items || [], { requireVatRate: true });
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: formatValidationErrors(validation.errors) }, { status: 400 });
    }

    const { creditNote, lineItems } = await updateCreditNoteWithItems({
      creditNoteId: id,
      client_id,
      issue_date,
      status: status || 'Draft',
      reason,
      notes,
      line_items: validation.items,
      invoice_id,
    });

    return NextResponse.json({ success: true, creditNote, lineItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Credit note update failed.' },
      { status: 500 }
    );
  }
}
