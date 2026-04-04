import { wrapWithActionResult, actionSuccess, actionFailed, actionNeedInfo } from "@/lib/assistant-action";

function getSupabase() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createAdminClient } = require("@/lib/supabase/admin");
    return createAdminClient();
  }
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function executeCreateTask(
  args: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    dueTime?: string;
    category?: string;
    clientName?: string;
    tags?: string[];
    notes?: string;
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    let clientId: string | null = null;
    let clientCompanyName: string | null = null;

    if (args.clientName) {
      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name")
        .ilike("company_name", `%${args.clientName}%`)
        .limit(5);

      if (clientError) {
        return wrapWithActionResult(actionFailed({
          action: "create_task",
          targetType: "task",
          toolUsed: "createTask",
          error: `Error looking up client: ${clientError.message}`,
          nextStep: "Please check the client name and try again."
        }));
      }

      if (clients && clients.length === 1) {
        clientId = clients[0].id;
        clientCompanyName = clients[0].company_name;
      } else if (clients && clients.length > 1) {
        const exactMatch = clients.find(
          (c: any) => c.company_name.toLowerCase() === args.clientName!.toLowerCase()
        );
        if (exactMatch) {
          clientId = exactMatch.id;
          clientCompanyName = exactMatch.company_name;
        } else {
          const matchList = clients.map((c: any) => `"${c.company_name}"`).join(", ");
          return wrapWithActionResult(actionNeedInfo({
            action: "create_task",
            targetType: "task",
            toolUsed: "createTask",
            missingFields: ["clientName"],
            nextStep: `Multiple clients match '${args.clientName}': ${matchList}. Please specify the exact client name.`
          }));
        }
      }
    }

    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: args.title,
        description: args.description || null,
        status: "todo",
        priority: args.priority || "medium",
        due_date: args.dueDate || null,
        due_time: args.dueTime || null,
        category: args.category || null,
        client_id: clientId,
        tags: args.tags || [],
        notes: args.notes || null,
      })
      .select("id, title, status, priority, due_date, due_time, category")
      .single();

    if (insertError) {
      return wrapWithActionResult(actionFailed({
        action: "create_task",
        targetType: "task",
        toolUsed: "createTask",
        error: `Failed to create task: ${insertError.message}`,
        nextStep: "Please try again."
      }));
    }

    let message = `Task created: "${task.title}"`;
    message += ` | Priority: ${task.priority}`;
    if (task.due_date) message += ` | Due: ${task.due_date}`;
    if (task.due_time) message += ` at ${task.due_time}`;
    if (task.category) message += ` | Category: ${task.category}`;
    if (clientCompanyName) message += ` | Client: ${clientCompanyName}`;

    return wrapWithActionResult(
      actionSuccess({
        action: "create_task",
        targetType: "task",
        targetReference: task.title,
        toolUsed: "createTask",
        summary: message,
        verified: true,
      }),
      {
        task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          due_date: task.due_date,
          due_time: task.due_time,
          category: task.category,
          client_name: clientCompanyName,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "create_task",
      targetType: "task",
      toolUsed: "createTask",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

export async function executeUpdateTask(
  args: {
    taskIdentifier: string;
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    dueTime?: string;
    category?: string;
    notes?: string;
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    const { data: tasks, error: searchError } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, due_time, category")
      .eq("user_id", user.id)
      .ilike("title", `%${args.taskIdentifier}%`)
      .limit(10);

    if (searchError) {
      return wrapWithActionResult(actionFailed({
        action: "update_task",
        targetType: "task",
        toolUsed: "updateTask",
        error: `Error searching for task: ${searchError.message}`,
        nextStep: "Please try again."
      }));
    }

    if (!tasks || tasks.length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "update_task",
        targetType: "task",
        toolUsed: "updateTask",
        error: `No task found matching "${args.taskIdentifier}".`,
        nextStep: "Please check the task name and try again."
      }));
    }

    let task: any;
    if (tasks.length === 1) {
      task = tasks[0];
    } else {
      const exactMatch = tasks.find(
        (t: any) => t.title.toLowerCase() === args.taskIdentifier.toLowerCase()
      );
      if (exactMatch) {
        task = exactMatch;
      } else {
        const matchList = tasks.map((t: any) => `"${t.title}" (${t.priority}, due: ${t.due_date || "no date"})`).join("; ");
        return wrapWithActionResult(actionNeedInfo({
          action: "update_task",
          targetType: "task",
          toolUsed: "updateTask",
          missingFields: ["taskIdentifier"],
          nextStep: `Multiple tasks match "${args.taskIdentifier}": ${matchList}. Please be more specific.`
        }));
      }
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.status !== undefined) updates.status = args.status;
    if (args.dueDate !== undefined) updates.due_date = args.dueDate;
    if (args.dueTime !== undefined) updates.due_time = args.dueTime;
    if (args.category !== undefined) updates.category = args.category;
    if (args.notes !== undefined) updates.notes = args.notes;

    if (args.status === "done") {
      updates.completed_at = new Date().toISOString();
    }
    if (args.status && args.status !== "done") {
      updates.completed_at = null;
    }

    if (Object.keys(updates).length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "update_task",
        targetType: "task",
        toolUsed: "updateTask",
        error: "No fields to update.",
        nextStep: "Please specify what to change."
      }));
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", task.id)
      .select("id, title, status, priority, due_date, due_time, category")
      .single();

    if (updateError) {
      return wrapWithActionResult(actionFailed({
        action: "update_task",
        targetType: "task",
        toolUsed: "updateTask",
        error: `Failed to update task: ${updateError.message}`,
        nextStep: "Please try again."
      }));
    }

    const changes = Object.keys(updates)
      .filter(k => k !== "completed_at")
      .map(k => `${k}: ${updates[k]}`)
      .join(", ");

    return wrapWithActionResult(
      actionSuccess({
        action: "update_task",
        targetType: "task",
        targetReference: updatedTask.title,
        toolUsed: "updateTask",
        summary: `Task "${updatedTask.title}" updated. Changes: ${changes}.`,
        verified: true,
      }),
      {
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          status: updatedTask.status,
          priority: updatedTask.priority,
          due_date: updatedTask.due_date,
          category: updatedTask.category,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "update_task",
      targetType: "task",
      toolUsed: "updateTask",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

export async function executeCompleteTask(
  args: { taskIdentifier: string },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    const { data: tasks, error: searchError } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("user_id", user.id)
      .ilike("title", `%${args.taskIdentifier}%`)
      .limit(10);

    if (searchError) {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `Error searching for task: ${searchError.message}`,
        nextStep: "Please try again."
      }));
    }

    if (!tasks || tasks.length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `No task found matching "${args.taskIdentifier}".`,
        nextStep: "Please check the task name and try again."
      }));
    }

    let task: any;
    if (tasks.length === 1) {
      task = tasks[0];
    } else {
      const exactMatch = tasks.find(
        (t: any) => t.title.toLowerCase() === args.taskIdentifier.toLowerCase()
      );
      if (exactMatch) {
        task = exactMatch;
      } else {
        const matchList = tasks.map((t: any) => `"${t.title}" (${t.priority}, due: ${t.due_date || "no date"})`).join("; ");
        return wrapWithActionResult(actionNeedInfo({
          action: "complete_task",
          targetType: "task",
          toolUsed: "completeTask",
          missingFields: ["taskIdentifier"],
          nextStep: `Multiple tasks match "${args.taskIdentifier}": ${matchList}. Please be more specific.`
        }));
      }
    }

    if (task.status === "done") {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `Task "${task.title}" is already completed.`,
        nextStep: "No action needed."
      }));
    }

    if (task.status === "cancelled") {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `Task "${task.title}" was cancelled and cannot be completed.`,
        nextStep: "You may want to create a new task instead."
      }));
    }

    const completedAt = new Date().toISOString();

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({ status: "done", completed_at: completedAt })
      .eq("id", task.id)
      .select("id, title, status")
      .single();

    if (updateError) {
      return wrapWithActionResult(actionFailed({
        action: "complete_task",
        targetType: "task",
        toolUsed: "completeTask",
        error: `Failed to complete task: ${updateError.message}`,
        nextStep: "Please try again."
      }));
    }

    return wrapWithActionResult(
      actionSuccess({
        action: "complete_task",
        targetType: "task",
        targetReference: updatedTask.title,
        toolUsed: "completeTask",
        summary: `Task completed: "${updatedTask.title}". Well done!`,
        verified: true,
      }),
      {
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          previous_status: task.status,
          completed_at: completedAt,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "complete_task",
      targetType: "task",
      toolUsed: "completeTask",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

export async function executeQueryTasks(
  args: {
    queryType: string;
    priority?: string;
    clientName?: string;
    category?: string;
    searchTerm?: string;
  },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    const today = new Date().toISOString().split("T")[0];
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (args.queryType === "stats") {
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("id, status, due_date, priority")
        .eq("user_id", user.id);

      const tasks = allTasks || [];
      const stats = {
        total: tasks.length,
        todo: tasks.filter((t: any) => t.status === "todo").length,
        in_progress: tasks.filter((t: any) => t.status === "in_progress").length,
        done: tasks.filter((t: any) => t.status === "done").length,
        overdue: tasks.filter((t: any) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "cancelled").length,
        due_today: tasks.filter((t: any) => t.due_date === today && t.status !== "done" && t.status !== "cancelled").length,
        urgent: tasks.filter((t: any) => t.priority === "urgent" && t.status !== "done" && t.status !== "cancelled").length,
      };

      return wrapWithActionResult(
        actionSuccess({
          action: "query_tasks",
          targetType: "task_query",
          targetReference: "stats",
          toolUsed: "queryTasks",
          summary: `You have ${stats.total} total tasks: ${stats.todo} to do, ${stats.in_progress} in progress, ${stats.done} completed. ${stats.overdue} overdue, ${stats.due_today} due today, ${stats.urgent} urgent.`,
          verified: true,
        }),
        { stats }
      );
    }

    let query = supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, due_time, category, client_id, clients(company_name)")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    switch (args.queryType) {
      case "today":
        query = query.eq("due_date", today).neq("status", "done").neq("status", "cancelled");
        break;
      case "overdue":
        query = query.lt("due_date", today).neq("status", "done").neq("status", "cancelled");
        break;
      case "this_week":
        query = query.gte("due_date", today).lte("due_date", weekEnd).neq("status", "done").neq("status", "cancelled");
        break;
      case "all_open":
        query = query.neq("status", "done").neq("status", "cancelled");
        break;
      case "by_priority":
        if (args.priority) {
          query = query.eq("priority", args.priority).neq("status", "done").neq("status", "cancelled");
        }
        break;
      case "by_client":
        if (args.clientName) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id")
            .ilike("company_name", `%${args.clientName}%`)
            .limit(1);
          if (clients && clients.length > 0) {
            query = query.eq("client_id", clients[0].id);
          } else {
            return wrapWithActionResult(
              actionSuccess({
                action: "query_tasks",
                targetType: "task_query",
                targetReference: args.clientName,
                toolUsed: "queryTasks",
                summary: `No client found matching '${args.clientName}'.`,
                verified: true,
              }),
              { tasks: [], count: 0 }
            );
          }
        }
        break;
      case "by_category":
        if (args.category) {
          query = query.eq("category", args.category).neq("status", "done").neq("status", "cancelled");
        }
        break;
      case "search":
        if (args.searchTerm) {
          query = query.or(`title.ilike.%${args.searchTerm}%,description.ilike.%${args.searchTerm}%`);
        }
        break;
    }

    const { data: tasks, error } = await query.limit(25);

    if (error) {
      return wrapWithActionResult(actionFailed({
        action: "query_tasks",
        targetType: "task_query",
        toolUsed: "queryTasks",
        error: `Failed to query tasks: ${error.message}`,
        nextStep: "Please try again."
      }));
    }

    const formattedTasks = (tasks || []).map((t: any) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      category: t.category,
      client: t.clients?.company_name || null,
    }));

    const queryLabels: Record<string, string> = {
      today: "due today",
      overdue: "overdue",
      this_week: "due this week",
      all_open: "open",
      by_priority: `${args.priority} priority`,
      by_client: `for client "${args.clientName}"`,
      by_category: `in category "${args.category}"`,
      search: `matching "${args.searchTerm}"`,
    };

    return wrapWithActionResult(
      actionSuccess({
        action: "query_tasks",
        targetType: "task_query",
        targetReference: args.queryType,
        toolUsed: "queryTasks",
        summary: formattedTasks.length === 0
          ? `No ${queryLabels[args.queryType] || ""} tasks found.`
          : `Found ${formattedTasks.length} ${queryLabels[args.queryType] || ""} task(s).`,
        verified: true,
      }),
      {
        queryType: args.queryType,
        count: formattedTasks.length,
        tasks: formattedTasks,
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "query_tasks",
      targetType: "task_query",
      toolUsed: "queryTasks",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}

export async function executeDeleteTask(
  args: { taskIdentifier: string },
  user: { id: string }
): Promise<string> {
  const supabase = getSupabase();

  try {
    const { data: tasks, error: searchError } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("user_id", user.id)
      .ilike("title", `%${args.taskIdentifier}%`)
      .limit(10);

    if (searchError) {
      return wrapWithActionResult(actionFailed({
        action: "delete_task",
        targetType: "task",
        toolUsed: "deleteTask",
        error: `Error searching for task: ${searchError.message}`,
        nextStep: "Please try again."
      }));
    }

    if (!tasks || tasks.length === 0) {
      return wrapWithActionResult(actionFailed({
        action: "delete_task",
        targetType: "task",
        toolUsed: "deleteTask",
        error: `No task found matching "${args.taskIdentifier}".`,
        nextStep: "Please check the task name and try again."
      }));
    }

    let task: any;
    if (tasks.length === 1) {
      task = tasks[0];
    } else {
      const exactMatch = tasks.find(
        (t: any) => t.title.toLowerCase() === args.taskIdentifier.toLowerCase()
      );
      if (exactMatch) {
        task = exactMatch;
      } else {
        const matchList = tasks.map((t: any) => `"${t.title}" (${t.priority}, due: ${t.due_date || "no date"})`).join("; ");
        return wrapWithActionResult(actionNeedInfo({
          action: "delete_task",
          targetType: "task",
          toolUsed: "deleteTask",
          missingFields: ["taskIdentifier"],
          nextStep: `Multiple tasks match "${args.taskIdentifier}": ${matchList}. Please be more specific.`
        }));
      }
    }

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id);

    if (deleteError) {
      return wrapWithActionResult(actionFailed({
        action: "delete_task",
        targetType: "task",
        toolUsed: "deleteTask",
        error: `Failed to delete task: ${deleteError.message}`,
        nextStep: "Please try again."
      }));
    }

    const { data: verifyTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", task.id);

    const isVerified = !verifyTasks || verifyTasks.length === 0;

    return wrapWithActionResult(
      actionSuccess({
        action: "delete_task",
        targetType: "task",
        targetReference: task.title,
        toolUsed: "deleteTask",
        summary: `Task deleted: "${task.title}" (priority: ${task.priority}, due: ${task.due_date || "no date"}).`,
        verified: isVerified,
      }),
      {
        deleted_task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          due_date: task.due_date,
        },
      }
    );
  } catch (err: any) {
    return wrapWithActionResult(actionFailed({
      action: "delete_task",
      targetType: "task",
      toolUsed: "deleteTask",
      error: `Unexpected error: ${err.message}`,
      nextStep: "Please try again."
    }));
  }
}