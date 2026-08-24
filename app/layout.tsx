import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Mulish } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { AnalyticsInit } from "@/components/analytics/AnalyticsInit";
import { getSessionUser } from "@/lib/auth";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${mulish.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <AnalyticsInit userId={user?.id ?? null} />
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
          {children}
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}
