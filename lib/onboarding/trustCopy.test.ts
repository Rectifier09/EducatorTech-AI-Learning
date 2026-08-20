import { describe, it, expect } from "vitest";
import { trustMessage } from "./trustCopy";

describe("trustMessage", () => {
  it("reassures skeptical/cautious educators and keeps them in charge", () => {
    for (const a of ["skeptical", "cautious"] as const) {
      const m = trustMessage(a);
      expect(m.mascotMood).toBe("reassure");
      expect(`${m.headline} ${m.body}`.toLowerCase()).toMatch(
        /judgement|in charge|wrong/,
      );
    }
  });

  it("channels the energy of excited/curious educators", () => {
    for (const a of ["excited", "curious"] as const) {
      expect(trustMessage(a).mascotMood).toBe("cheer");
    }
  });
});
