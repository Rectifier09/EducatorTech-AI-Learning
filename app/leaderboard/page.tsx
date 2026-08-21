import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Superseded by /you (Phase 2 redesign, 3-tab IA: Learn·Create·You).
export default function LeaderboardPage() {
  redirect("/you");
}
