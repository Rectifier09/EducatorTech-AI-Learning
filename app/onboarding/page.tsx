import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { isOnboardingComplete } from "@/lib/data/mappers";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (isOnboardingComplete(profile)) redirect("/path");

  const firstName = user.name?.split(" ")[0] ?? null;
  return <OnboardingFlow firstName={firstName} />;
}
