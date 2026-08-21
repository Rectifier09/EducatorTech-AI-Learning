import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { isOnboardingComplete } from "@/lib/data/mappers";

export const dynamic = "force-dynamic";

// Routing hub: send the visitor to the right place based on auth + onboarding.
export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!isOnboardingComplete(profile)) redirect("/onboarding");

  redirect("/learn");
}
