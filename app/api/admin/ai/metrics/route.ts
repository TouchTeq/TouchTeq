import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { computeReliabilityMetrics, getMetricsForLastDays, getWeeklyComparison } from "@/lib/ai/metrics";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuthenticatedUser();
    const user = authResult.user;
    
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "7";
    const days = parseInt(period, 10);
    const periodType = searchParams.get("type") || "metrics";
    
    if (isNaN(days) || days < 1 || days > 90) {
      return NextResponse.json({ error: "Invalid period. Must be 1-90 days." }, { status: 400 });
    }
    
    let data;
    
    switch (periodType) {
      case "weekly":
        data = await getWeeklyComparison(user.id);
        break;
      case "metrics":
      default:
        data = await getMetricsForLastDays(user.id, days);
        break;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[AI Metrics] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch metrics" }, { status: 500 });
  }
}
