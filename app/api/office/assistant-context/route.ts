import { NextResponse } from "next/server";
import { requireAuthenticatedUser, isAuthError } from "@/lib/auth/require-user";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

function getSupabase() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  try {
    await requireAuthenticatedUser();

    const supabase = getSupabase();
    const [businessProfileRes, clientsRes, memoryRes] = await Promise.all([
      supabase
        .from("business_profile")
        .select("business_name, vat_number, address, email")
        .maybeSingle(),
      supabase
        .from("clients")
        .select("id, company_name, email, phone")
        .order("company_name"),
      supabase
        .from("ai_memory")
        .select("category, key, value")
        .order("category")
        .order("last_updated", { ascending: false }),
    ]);

    return NextResponse.json({
      businessProfile: businessProfileRes.data || null,
      clients: clientsRes.data || [],
      aiMemory: memoryRes.data || [],
    });
  } catch (error: any) {
    if (isAuthError(error)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
