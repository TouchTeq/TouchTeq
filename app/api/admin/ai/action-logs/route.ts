import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuthenticatedUser();
    const user = authResult.user;
    
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const toolName = searchParams.get("tool");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    
    const supabase = createAdminClient();
    
    let query = supabase
      .from("ai_action_log")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (toolName) {
      query = query.eq("tool_name", toolName);
    }
    if (status) {
      query = query.eq("action_status", status);
    }
    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error("[AI Action Logs] Query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[AI Action Logs] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch logs" }, { status: 500 });
  }
}
