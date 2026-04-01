"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  client_id: string | null;
  task_id: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  recurring_until: string | null;
  status: string;
  colour: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function createCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const start_date = formData.get("start_date") as string;
  const event_type = formData.get("event_type") as string || "appointment";
  
  const eventData: Record<string, unknown> = {
    user_id: user.id,
    title,
    start_date,
    event_type,
  };

  const fields = [
    "description", "start_time", "end_date", "end_time", "all_day",
    "location", "client_id", "task_id", "is_recurring", "recurring_frequency",
    "recurring_until", "status", "colour", "notes"
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value) {
      if (field === "all_day" || field === "is_recurring") {
        eventData[field] = value === "true";
      } else if (field === "client_id" || field === "task_id") {
        eventData[field] = value || null;
      } else {
        eventData[field] = value;
      }
    }
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert(eventData)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/office/calendar");
  return { data };
}

export async function getCalendarEvents(
  startDate?: string,
  endDate?: string,
  eventType?: string,
  clientId?: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (startDate) query = query.gte("start_date", startDate);
  if (endDate) query = query.lte("start_date", endDate);
  if (eventType) query = query.eq("event_type", eventType);
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data: data || [] };
}

export async function updateCalendarEvent(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: checkError } = await supabase
    .from("calendar_events")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (checkError) return { error: "Event not found or unauthorized" };

  const updateData: Record<string, unknown> = {};

  const fields = [
    "title", "description", "event_type", "start_date", "start_time",
    "end_date", "end_time", "all_day", "location", "client_id", "task_id",
    "is_recurring", "recurring_frequency", "recurring_until", "status", "colour", "notes"
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null && value !== "") {
      if (field === "all_day" || field === "is_recurring") {
        updateData[field] = value === "true";
      } else if (field === "client_id" || field === "task_id") {
        updateData[field] = value || null;
      } else {
        updateData[field] = value;
      }
    }
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/office/calendar");
  return { data };
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: checkError } = await supabase
    .from("calendar_events")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (checkError) return { error: "Event not found or unauthorized" };

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/office/calendar");
  return { success: true };
}

export async function updateEventStatus(id: string, status: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("calendar_events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/office/calendar");
  return { success: true };
}

export async function getUpcomingEvents(limit: number = 5) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);

  if (error) return { error: error.message };
  return { data: data || [] };
}