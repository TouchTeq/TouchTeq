import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditCreditNoteClient from './EditCreditNoteClient';

export default async function EditCreditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: creditNote, error } = await supabase
    .from('credit_notes')
    .select('*, credit_note_items(*), clients(*)')
    .eq('id', id)
    .single();

  if (error || !creditNote) {
    notFound();
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('company_name');

  return (
    <div className="space-y-8">
      <EditCreditNoteClient initialCreditNote={creditNote} clients={clients || []} />
    </div>
  );
}
