import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile, upsertProfile } from "@/lib/data/profile";
import { logEvent } from "@/lib/data/events";

/** OAuth callback: exchange the code for a session, then continue into the app. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await captureReferral(data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

/**
 * If a referral cookie is pending and this is a genuinely new user
 * (no profile row yet), attribute the signup and clear the cookie.
 * Never overwrites an existing user's referred_by, and never lets a
 * user be attributed as their own referrer.
 */
async function captureReferral(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const referredBy = cookieStore.get("referred_by")?.value;
  if (!referredBy || referredBy === userId) return;

  const existing = await getProfile(userId);
  if (existing) return;

  await upsertProfile(userId, { referredBy });
  await logEvent("referral_signup", { referredBy });
  cookieStore.delete("referred_by");
}
