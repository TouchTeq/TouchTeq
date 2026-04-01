import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { listConversationSummaries, loadActiveConversation } from "@/lib/ai/conversations";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuthenticatedUser();
    const user = authResult.user;
    
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "list";
    
    let data;
    
    if (action === "active") {
      data = await loadActiveConversation();
    } else {
      const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
      data = await listConversationSummaries(limit);
    }
    
    return NextResponse.json({ conversations: data });
  } catch (error: any) {
    console.error("[AI Conversations] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch conversations" }, { status: 500 });
  }
}
