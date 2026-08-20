import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/** Current signed-in user (server-side), or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

/** Server action: sign out and return to the login page. */
export async function signOut(): Promise<void> {
  "use server";
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
