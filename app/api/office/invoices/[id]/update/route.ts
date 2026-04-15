import { NextResponse } from 'next/server';
import { updateInvoiceWithItems } from '@/lib/office/document-updates';
import { validateLineItems, formatValidationErrors } from '@/lib/office/line-item-validation';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invoice id is required.' }, { status: 400 });
    }

    const {
      client_id,
      issue_date,
      due_date,
      status,
      notes,
      internal_notes,
      reference,
      line_items,
      quick_client_name,
      quick_client_email,
      quick_client_address,
    } = body || {};

    // client_id can be null for quick client invoices
    if (!issue_date || !due_date) {
      return NextResponse.json({ success: false, error: 'Issue date and due date are required.' }, { status: 400 });
    }

    // If client_id is null, quick_client_name is required (check trimmed for whitespace-only input)
    const hasQuickClientName = quick_client_name && quick_client_name.trim() && quick_client_name.trim().length > 0;
    if (!client_id && !hasQuickClientName) {
      return NextResponse.json({ success: false, error: 'Client name is required for quick client invoices.' }, { status: 400 });
    }

    const validation = validateLineItems(line_items || []);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: formatValidationErrors(validation.errors) }, { status: 400 });
    }

    const { invoice, lineItems } = await updateInvoiceWithItems({
      invoiceId: id,
      clientId: client_id,
      issue_date,
      due_date,
      status: status || 'Draft',
      notes,
      internal_notes,
      reference,
      line_items: validation.items,
      quick_client_name,
      quick_client_email,
      quick_client_address,
    });

    return NextResponse.json({ success: true, invoice, lineItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Invoice update failed.' },
      { status: 500 }
    );
  }
}
