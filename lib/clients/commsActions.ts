'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function logCommunication(data: {
  client_id: string;
  type: string;
  subject?: string;
  sent_from?: string;
  status: 'Delivered' | 'Failed' | 'Recorded';
  content?: string;
  note_type?: string;
  is_manual?: boolean;
  metadata?: any;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('client_communications').insert([
    {
      ...data,
      timestamp: new Date().toISOString()
    }
  ]);
  
  if (error) {
    console.error('Failed to log communication:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath(`/office/clients/${data.client_id}`);
  return { success: true };
}

export async function getClientCommunications(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('client_communications')
    .select('*')
    .eq('client_id', clientId)
    .order('timestamp', { ascending: false });
    
  if (error) {
    console.error('Error fetching communications:', error);
    return [];
  }
  return data;
}

export async function updateManualNote(id: string, content: string, noteType: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('client_communications')
    .update({ content, note_type: noteType })
    .eq('id', id)
    .eq('is_manual', true);
    
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteManualNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('client_communications')
    .delete()
    .eq('id', id)
    .eq('is_manual', true);
    
  if (error) return { success: false, error: error.message };
  return { success: true };
}
