export type TabKey = "learn" | "create" | "you";

export function activeTab(pathname: string): TabKey | null {
  if (pathname.startsWith("/learn")) return "learn";
  if (
    pathname.startsWith("/create") ||
    pathname.startsWith("/playground") ||
    pathname.startsWith("/toolkit")
  )
    return "create";
  if (pathname.startsWith("/you") || pathname.startsWith("/leaderboard"))
    return "you";
  return null;
}
