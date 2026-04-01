"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Note {
  id: string;
  title: string | null;
  content: string;
  note_type: "general" | "call" | "meeting" | "site_visit" | "quick";
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  call_direction: string | null;
  meeting_attendees: string[] | null;
  site_name: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  follow_up_completed: boolean;
  client_id: string | null;
  invoice_id: string | null;
  quote_id: string | null;
  task_id: string | null;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  client?: { company_name: string } | null;
}

export async function getNotes(filters?: {
  noteType?: string;
  clientId?: string;
  isPinned?: boolean;
  followUpPending?: boolean;
  search?: string;
  limit?: number;
}): Promise<Note[]> {
  const supabase = await createClient();

  let query = supabase
    .from("notes")
    .select(`
      *,
      client:clients(company_name)
    `)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters?.limit || 50);

  if (filters?.noteType && filters.noteType !== "all") {
    query = query.eq("note_type", filters.noteType);
  }
  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }
  if (filters?.isPinned) {
    query = query.eq("is_pinned", true);
  }
  if (filters?.followUpPending) {
    query = query.eq("follow_up_required", true).eq("follow_up_completed", false);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notes:", error);
    return [];
  }

  return (data || []) as Note[];
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select(`*, client:clients(company_name)`)
    .eq("id", noteId)
    .single();

  if (error) return null;
  return data as Note;
}

export async function createNote(note: {
  title?: string;
  content: string;
  note_type?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  call_direction?: string;
  meeting_attendees?: string[];
  site_name?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  client_id?: string;
  invoice_id?: string;
  quote_id?: string;
  task_id?: string;
  tags?: string[];
  is_pinned?: boolean;
}): Promise<{ success: boolean; note?: Note; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .insert({
      title: note.title || null,
      content: note.content,
      note_type: note.note_type || "general",
      contact_name: note.contact_name || null,
      contact_phone: note.contact_phone || null,
      contact_email: note.contact_email || null,
      call_direction: note.call_direction || null,
      meeting_attendees: note.meeting_attendees || null,
      site_name: note.site_name || null,
      follow_up_required: note.follow_up_required || false,
      follow_up_date: note.follow_up_date || null,
      follow_up_notes: note.follow_up_notes || null,
      follow_up_completed: false,
      client_id: note.client_id || null,
      invoice_id: note.invoice_id || null,
      quote_id: note.quote_id || null,
      task_id: note.task_id || null,
      tags: note.tags || [],
      is_pinned: note.is_pinned || false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/office/notes");
  return { success: true, note: data as Note };
}

export async function updateNote(
  noteId: string,
  updates: Partial<{
    title: string;
    content: string;
    note_type: string;
    follow_up_required: boolean;
    follow_up_date: string;
    follow_up_notes: string;
    follow_up_completed: boolean;
    tags: string[];
    is_pinned: boolean;
  }>
): Promise<{ success: boolean; note?: Note; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", noteId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/office/notes");
  return { success: true, note: data as Note };
}

export async function deleteNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/office/notes");
  return { success: true };
}
