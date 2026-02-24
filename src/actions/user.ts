// @ts-nocheck
// Svoi — User profile server actions
"use server";

import { createClient } from "@/lib/supabase/server";
import type { SvoiUser } from "@/lib/supabase/database.types";

export type ProfileUpdate = Partial<
  Pick<SvoiUser, "phone" | "location" | "email" | "first_name" | "last_name" | "completed_profile" | "avatar_url">
>;

/** Update current user's profile */
export async function updateProfile(
  userId: string,
  data: ProfileUpdate
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update(data)
    .eq("id", userId);

  if (error) {
    console.error("[updateProfile]", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Fetch current user's full profile */
export async function getMyProfile(userId: string): Promise<SvoiUser | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data;
}
