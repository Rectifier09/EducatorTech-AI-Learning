import type { Attitude } from "@/lib/data/types";

export function tonePrefs(attitude: Attitude): {
  pace: "gentle" | "standard";
  showGoDeeper: boolean;
} {
  if (attitude === "skeptical" || attitude === "cautious") {
    return { pace: "gentle", showGoDeeper: false };
  }
  return { pace: "standard", showGoDeeper: true };
}
