import { NextResponse } from 'next/server';
import { updatePurchaseOrderWithItems } from '@/lib/office/document-updates';
import { validateLineItems, formatValidationErrors } from '@/lib/office/line-item-validation';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Purchase order id is required.' }, { status: 400 });
    }

    const {
      supplier_name,
      supplier_contact,
      supplier_email,
      date_raised,
      delivery_date,
      status,
      notes,
      linked_quote_id,
      linked_invoice_id,
      line_items,
    } = body || {};

    if (!supplier_name) {
      return NextResponse.json({ success: false, error: 'Supplier name is required.' }, { status: 400 });
    }

    if (!date_raised) {
      return NextResponse.json({ success: false, error: 'Date raised is required.' }, { status: 400 });
    }

    const validation = validateLineItems(line_items || []);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: formatValidationErrors(validation.errors) }, { status: 400 });
    }

    const { purchaseOrder, lineItems } = await updatePurchaseOrderWithItems({
      poId: id,
      supplier_name,
      supplier_contact,
      supplier_email,
      date_raised,
      delivery_date,
      status: status || 'Draft',
      notes,
      linked_quote_id,
      linked_invoice_id,
      line_items: validation.items,
    });

    return NextResponse.json({ success: true, purchaseOrder, lineItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Purchase order update failed.' },
      { status: 500 }
    );
  }
}
