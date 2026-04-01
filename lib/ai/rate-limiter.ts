import { SupabaseClient } from "@supabase/supabase-js";

const RATE_LIMIT_PER_MINUTE = 30;
const RATE_LIMIT_PER_DAY = 500;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: string;
  message?: string;
}

export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  const now = new Date();

  const minuteWindowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

  const { data: minuteData } = await supabaseAdmin
    .from("ai_rate_limits")
    .select("request_count")
    .eq("user_id", userId)
    .eq("window_start", minuteWindowStart.toISOString())
    .single();

  const minuteCount = minuteData?.request_count || 0;

  if (minuteCount >= RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(minuteWindowStart.getTime() + 60000).toISOString(),
      message: `Rate limit exceeded. Maximum ${RATE_LIMIT_PER_MINUTE} requests per minute. Please wait a moment.`,
    };
  }

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const { data: dayData } = await supabaseAdmin
    .from("ai_rate_limits")
    .select("request_count")
    .eq("user_id", userId)
    .gte("window_start", dayStart.toISOString())
    .lt("window_start", dayEnd.toISOString());

  const totalToday = (dayData || []).reduce((sum: number, row: any) => sum + (row.request_count || 0), 0);

  if (totalToday >= RATE_LIMIT_PER_DAY) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: dayEnd.toISOString(),
      message: `Daily limit of ${RATE_LIMIT_PER_DAY} requests reached. Limit resets at midnight.`,
    };
  }

  const { data: result, error: rpcError } = await supabaseAdmin.rpc("increment_ai_rate_limit", {
    p_user_id: userId,
    p_window_start: minuteWindowStart.toISOString(),
    p_max_per_minute: RATE_LIMIT_PER_MINUTE,
  });

  if (rpcError) {
    console.error("Rate limit increment error:", rpcError);
    return {
      allowed: true,
      remaining: RATE_LIMIT_PER_MINUTE - minuteCount - 1,
    };
  }

  const rpcResult = Array.isArray(result) ? result[0] : result;

  return {
    allowed: rpcResult?.allowed ?? true,
    remaining: rpcResult?.remaining ?? RATE_LIMIT_PER_MINUTE - minuteCount - 1,
  };
}
