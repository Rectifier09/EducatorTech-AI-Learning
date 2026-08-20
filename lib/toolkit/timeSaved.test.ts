import { describe, it, expect } from "vitest";
import { totalMinutesSaved, formatHoursSaved } from "./timeSaved";

describe("time saved", () => {
  it("sums per-artifact manual-time estimates", () => {
    const mins = totalMinutesSaved([
      { artifactType: "Worksheet" },
      { artifactType: "Quiz" },
      { artifactType: "Lesson-plan outline" },
    ]);
    expect(mins).toBe(90);
    expect(formatHoursSaved(mins)).toBe("~1.5 hours");
  });

  it("uses a default for unknown/null types", () => {
    expect(totalMinutesSaved([{ artifactType: null }])).toBeGreaterThan(0);
  });

  it("formats a single hour without an 's'", () => {
    expect(formatHoursSaved(60)).toBe("~1 hour");
  });
});
