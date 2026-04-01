"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function FollowUpsPage() {
  redirect("/office/reminders");
}