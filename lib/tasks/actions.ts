"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  category: string | null;
  client_id: string | null;
  invoice_id: string | null;
  quote_id: string | null;
  purchase_order_id: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { company_name: string } | null;
}

export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  clientId?: string;
  dueBefore?: string;
  dueAfter?: string;
  category?: string;
  search?: string;
}): Promise<Task[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }
  if (filters?.dueBefore) {
    query = query.lte("due_date", filters.dueBefore);
  }
  if (filters?.dueAfter) {
    query = query.gte("due_date", filters.dueAfter);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  const tasks = (data || []) as Task[];

  const clientIds = [...new Set(tasks.filter(t => t.client_id).map(t => t.client_id as string))];
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, company_name")
      .in("id", clientIds);

    const clientMap = new Map((clients || []).map(c => [c.id, c.company_name]));
    return tasks.map(task => ({
      ...task,
      client: task.client_id && clientMap.has(task.client_id)
        ? { company_name: clientMap.get(task.client_id)! }
        : null,
    }));
  }

  return tasks;
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (error) return null;

  const task = data as Task;

  if (task.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("company_name")
      .eq("id", task.client_id)
      .single();

    task.client = client ? { company_name: client.company_name } : null;
  }

  return task;
}

export async function createTask(task: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  due_time?: string;
  category?: string;
  client_id?: string;
  invoice_id?: string;
  quote_id?: string;
  purchase_order_id?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  tags?: string[];
  notes?: string;
}): Promise<{ success: boolean; task?: Task; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: task.title,
      description: task.description || null,
      status: "todo",
      priority: task.priority || "medium",
      due_date: task.due_date || null,
      due_time: task.due_time || null,
      category: task.category || null,
      client_id: task.client_id || null,
      invoice_id: task.invoice_id || null,
      quote_id: task.quote_id || null,
      purchase_order_id: task.purchase_order_id || null,
      is_recurring: task.is_recurring || false,
      recurring_frequency: task.recurring_frequency || null,
      tags: task.tags || [],
      notes: task.notes || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/office/tasks");
  return { success: true, task: data as Task };
}

export async function updateTask(
  taskId: string,
  updates: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date: string;
    due_time: string;
    category: string;
    client_id: string;
    tags: string[];
    notes: string;
  }>
): Promise<{ success: boolean; task?: Task; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const finalUpdates: any = { ...updates };
  if (updates.status === "done") {
    finalUpdates.completed_at = new Date().toISOString();
  }
  if (updates.status && updates.status !== "done") {
    finalUpdates.completed_at = null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(finalUpdates)
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/office/tasks");
  return { success: true, task: data as Task };
}

export async function deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/office/tasks");
  return { success: true };
}

export async function getTaskStats(): Promise<{
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, dueToday: 0, dueThisWeek: 0 };

  const { data: allTasks } = await supabase
    .from("tasks")
    .select("id, status, due_date")
    .eq("user_id", user.id);

  const tasks = allTasks || [];

  return {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(t =>
      t.due_date && t.due_date < today && t.status !== "done" && t.status !== "cancelled"
    ).length,
    dueToday: tasks.filter(t => t.due_date === today && t.status !== "done" && t.status !== "cancelled").length,
    dueThisWeek: tasks.filter(t =>
      t.due_date && t.due_date >= today && t.due_date <= weekEnd && t.status !== "done" && t.status !== "cancelled"
    ).length,
  };
}
