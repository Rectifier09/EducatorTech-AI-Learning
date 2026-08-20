import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "./types";
import { rowToProfile, profileToRow, type ProfileRow } from "./mappers";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function upsertProfile(
  userId: string,
  patch: Partial<Profile>,
): Promise<Profile> {
  const supabase = await createServerClient();
  const row = { ...profileToRow(patch), user_id: userId };
  const { data, error } = await supabase
    .from("profiles")
    .upsert(row)
    .select("*")
    .single();
  if (error) throw error;
  return rowToProfile(data as ProfileRow);
}
