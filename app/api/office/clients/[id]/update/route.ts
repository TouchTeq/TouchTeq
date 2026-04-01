import { NextResponse } from 'next/server';
import { updateClientWithContacts } from '@/lib/office/client-updates';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Client id is required.' }, { status: 400 });
    }

    const { client, contacts } = body || {};

    if (!client?.company_name) {
      return NextResponse.json({ success: false, error: 'Company name is required.' }, { status: 400 });
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one contact is required.' }, { status: 400 });
    }

    const result = await updateClientWithContacts({
      clientId: id,
      client,
      contacts,
    });

    return NextResponse.json({ success: true, client: result.client });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Client update failed.' },
      { status: 500 }
    );
  }
}
