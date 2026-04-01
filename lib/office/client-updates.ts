'use server';

import { createClient } from '@/lib/supabase/server';

export type ClientContactPayload = {
  id?: string | null;
  contact_type: string;
  full_name: string;
  job_title?: string | null;
  email?: string | null;
  cell_number?: string | null;
  landline_number?: string | null;
  extension?: string | null;
  notes?: string | null;
  is_primary?: boolean;
};

export async function updateClientWithContacts(input: {
  clientId: string;
  client: {
    company_name: string;
    physical_address?: string | null;
    postal_address?: string | null;
    vat_number?: string | null;
    notes?: string | null;
    is_active?: boolean;
    category?: string | null;
    opening_balance?: number | null;
    email_missing?: boolean;
  };
  contacts: ClientContactPayload[];
}) {
  const supabase = await createClient();

  const contacts = (input.contacts || []).map((c) => ({
    ...c,
    contact_type: String(c.contact_type || '').trim(),
    full_name: String(c.full_name || '').trim(),
    job_title: c.job_title ? String(c.job_title).trim() : null,
    email: c.email ? String(c.email).trim() : null,
    cell_number: c.cell_number ? String(c.cell_number).trim() : null,
    landline_number: c.landline_number ? String(c.landline_number).trim() : null,
    extension: c.extension ? String(c.extension).trim() : null,
    notes: c.notes ? String(c.notes).trim() : null,
    is_primary: !!c.is_primary,
    id: c.id ? String(c.id) : null,
  }));

  const primary =
    contacts.find((c) => c.is_primary) ||
    contacts.find((c) => c.contact_type === 'Technical') ||
    contacts[0];

  const legacyEmail =
    primary?.email ||
    contacts.find((c) => c.email)?.email ||
    null;

  const legacyPhone =
    primary?.cell_number ||
    primary?.landline_number ||
    '';

  const { error: updateError } = await supabase
    .from('clients')
    .update({
      ...input.client,
      contact_person: primary?.full_name || '',
      job_title: primary?.job_title || '',
      email: legacyEmail,
      phone: legacyPhone,
    })
    .eq('id', input.clientId);

  if (updateError) {
    throw new Error(updateError.message || 'Client update failed');
  }

  const existingIds = contacts
    .map((c) => c.id)
    .filter((id): id is string => Boolean(id));

  if (existingIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('client_contacts')
      .delete()
      .eq('client_id', input.clientId)
      .not('id', 'in', `(${existingIds.map((id) => `"${id}"`).join(',')})`);

    if (deleteError) {
      throw new Error(deleteError.message || 'Failed to remove stale contacts');
    }
  } else {
    const { error: deleteError } = await supabase
      .from('client_contacts')
      .delete()
      .eq('client_id', input.clientId);

    if (deleteError) {
      throw new Error(deleteError.message || 'Failed to remove existing contacts');
    }
  }

  const existingContacts = contacts.filter((c) => c.id);
  if (existingContacts.length > 0) {
    const { error: upsertError } = await supabase
      .from('client_contacts')
      .upsert(
        existingContacts.map((c) => ({
          id: c.id,
          client_id: input.clientId,
          contact_type: c.contact_type,
          full_name: c.full_name,
          job_title: c.job_title,
          email: c.email,
          cell_number: c.cell_number,
          landline_number: c.landline_number,
          extension: c.extension,
          notes: c.notes,
          is_primary: !!c.is_primary,
        })),
        { onConflict: 'id' }
      );

    if (upsertError) {
      throw new Error(upsertError.message || 'Failed to update contacts');
    }
  }

  const newContacts = contacts.filter((c) => !c.id);
  if (newContacts.length > 0) {
    const { error: insertError } = await supabase
      .from('client_contacts')
      .insert(
        newContacts.map((c) => ({
          client_id: input.clientId,
          contact_type: c.contact_type,
          full_name: c.full_name,
          job_title: c.job_title,
          email: c.email,
          cell_number: c.cell_number,
          landline_number: c.landline_number,
          extension: c.extension,
          notes: c.notes,
          is_primary: !!c.is_primary,
        }))
      );

    if (insertError) {
      throw new Error(insertError.message || 'Failed to create contacts');
    }
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*, client_contacts(*)')
    .eq('id', input.clientId)
    .single();

  if (clientError || !client) {
    throw new Error(clientError?.message || 'Failed to load updated client');
  }

  return { client };
}
