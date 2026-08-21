import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Superseded by /learn (the "Explore Learning" sub-tab covers this now).
export default function ExplorePage() {
  redirect("/learn");
}
