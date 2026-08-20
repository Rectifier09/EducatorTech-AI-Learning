import type { Attitude } from "@/lib/data/types";

export interface TrustMessage {
  headline: string;
  body: string;
  mascotMood: "reassure" | "cheer";
}

export function trustMessage(attitude: Attitude): TrustMessage {
  if (attitude === "skeptical" || attitude === "cautious") {
    return {
      headline: "You stay in charge.",
      body: "Good — a little scepticism makes you better at this. SahajAiVidya won't replace your judgement; it saves you time and keeps you in charge. We'll even teach you to catch AI when it's wrong.",
      mascotMood: "reassure",
    };
  }

  return {
    headline: "Let's channel that.",
    body:
      attitude === "curious"
        ? "Perfect mindset. Let's turn that curiosity into something you can use tomorrow."
        : "Love the energy — let's put it to work. You'll be making real material in minutes.",
    mascotMood: "cheer",
  };
}
