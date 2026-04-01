import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { replayAction } from "@/lib/ai/action-replay";

export async function POST(req: Request) {
  try {
    const authResult = await requireAuthenticatedUser();
    const user = authResult.user;
    
    const body = await req.json();
    const { actionLogId, forceReplay } = body;
    
    if (!actionLogId) {
      return NextResponse.json({ error: "actionLogId is required" }, { status: 400 });
    }
    
    const result = await replayAction(actionLogId, forceReplay === true);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[AI Replay] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to replay action" }, { status: 500 });
  }
}
