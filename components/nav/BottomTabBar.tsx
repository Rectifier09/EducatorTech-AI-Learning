"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeTab, type TabKey } from "@/lib/nav/tabs";

const TABS: { key: TabKey; href: string; label: string }[] = [
  { key: "learn", href: "/learn", label: "Learn" },
  { key: "create", href: "/create", label: "Create" },
  { key: "you", href: "/you", label: "You" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const active = activeTab(pathname);

  if (active === null) return null;

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-10 flex border-t border-line bg-[color:var(--paper)]/85 backdrop-blur"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] ${
              isActive ? "text-brand" : "text-muted"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                isActive ? "bg-brand" : "bg-transparent"
              }`}
            />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
