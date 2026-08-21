import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Mulish } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { BottomTabBar } from "@/components/nav/BottomTabBar";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${mulish.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
          {children}
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}
