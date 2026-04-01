"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  reminder_at: string;
  completed_at: string | null;
  status: "pending" | "sent" | "completed" | "cancelled" | "missed";
  reminder_type: "task" | "follow_up" | "meeting" | "call" | "custom";
  related_type: string | null;
  related_id: string | null;
  client_id: string | null;
  task_id: string | null;
  note_id: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  recurring_end_date: string | null;
  snoozed_until: string | null;
  snooze_count: number;
  created_at: string;
  updated_at: string;
  client?: { company_name: string } | null;
  task?: { title: string } | null;
  note?: { title: string } | null;
}

export async function createReminder(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const reminder_at = formData.get("reminder_at") as string;
  const reminder_type = formData.get("reminder_type") as string || "custom";
  
  const reminderData: Record<string, unknown> = {
    user_id: user.id,
    title,
    reminder_at,
    reminder_type,
    status: "pending",
  };

  if (formData.get("description")) {
    reminderData.description = formData.get("description");
  }

  const fields = [
    "related_type", "related_id", "client_id", "task_id", "note_id",
    "is_recurring", "recurring_frequency", "recurring_end_date"
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value) {
      if (field === "is_recurring") {
        reminderData[field] = value === "true";
      } else if (field === "client_id" || field === "task_id" || field === "note_id" || field === "related_id") {
        reminderData[field] = value || null;
      } else {
        reminderData[field] = value;
      }
    }
  }

  const { data, error } = await supabase
    .from("reminders")
    .insert(reminderData)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/office/reminders");
  return { data };
}

export async function getReminders(
  status?: string,
  startDate?: string,
  endDate?: string,
  reminderType?: string,
  clientId?: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let query = supabase
    .from("reminders")
    .select("*, client:clients(company_name), task:tasks(title), note:notes(title)")
    .eq("user_id", user.id)
    .order("reminder_at", { ascending: true });

  if (status) query = query.eq("status", status);
  if (startDate) query = query.gte("reminder_at", startDate);
  if (endDate) query = query.lte("reminder_at", endDate);
  if (reminderType) query = query.eq("reminder_type", reminderType);
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;

  if (error) return { error: error.message };
  return { data: data || [] };
}

export async function updateReminder(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: checkError } = await supabase
    .from("reminders")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (checkError) return { error: "Reminder not found or unauthorized" };

  const updateData: Record<string, unknown> = {};

  const fields = [
    "title", "description", "reminder_at", "reminder_type", "status",
    "related_type", "related_id", "client_id", "task_id", "note_id",
    "is_recurring", "recurring_frequency", "recurring_end_date"
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null && value !== "") {
      if (field === "is_recurring") {
        updateData[field] = value === "true";
      } else if (field === "client_id" || field === "task_id" || field === "note_id" || field === "related_id") {
        updateData[field] = value || null;
      } else {
        updateData[field] = value;
      }
    }
  }

  const { data, error } = await supabase
    .from("reminders")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/office/reminders");
  return { data };
}

export async function deleteReminder(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error: checkError } = await supabase
    .from("reminders")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (checkError) return { error: "Reminder not found or unauthorized" };

  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/office/reminders");
  return { success: true };
}

export async function completeReminder(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("reminders")
    .update({ 
      status: "completed", 
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/office/reminders");
  return { success: true };
}

export async function snoozeReminder(id: string, minutes: number = 15) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("reminders")
    .select("snooze_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("reminders")
      .update({ 
        snoozed_until: snoozeTime,
        snooze_count: existing.snooze_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  }

  revalidatePath("/office/reminders");
  return { success: true };
}

export async function getUpcomingReminders(limit: number = 10) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("reminders")
    .select("*, client:clients(company_name)")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .or("reminder_at.gte." + new Date().toISOString() + ",snoozed_until.gte." + new Date().toISOString())
    .order("reminder_at", { ascending: true })
    .limit(limit);

  if (error) return { error: error.message };
  return { data: data || [] };
}

export async function getReminderStats() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const now = new Date().toISOString();

  const { data: all } = await supabase
    .from("reminders")
    .select("status, reminder_at")
    .eq("user_id", user.id);

  const pending = all?.filter(r => r.status === "pending" && r.reminder_at >= now).length || 0;
  const overdue = all?.filter(r => r.status === "pending" && r.reminder_at < now).length || 0;
  const completed = all?.filter(r => r.status === "completed").length || 0;

  return { 
    total: all?.length || 0,
    pending,
    overdue,
    completed 
  };
}