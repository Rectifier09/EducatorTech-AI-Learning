import { describe, it, expect } from "vitest";
import { archetypeForArtifactType } from "./mapping";

describe("archetypeForArtifactType", () => {
  it("maps question-set-shaped labels", () => {
    expect(archetypeForArtifactType("Quiz")).toBe("questionSet");
    expect(archetypeForArtifactType("Worksheet")).toBe("questionSet");
    expect(archetypeForArtifactType("Tiered question bank")).toBe("questionSet");
  });

  it("maps outline-shaped labels", () => {
    expect(archetypeForArtifactType("Lesson-plan outline")).toBe("outline");
    expect(archetypeForArtifactType("Attendance tracker steps")).toBe("outline");
  });

  it("maps rubric-shaped labels", () => {
    expect(archetypeForArtifactType("Rubric")).toBe("rubric");
    expect(archetypeForArtifactType("Progress-flag rules")).toBe("rubric");
  });

  it("maps checklist-shaped labels", () => {
    expect(archetypeForArtifactType("De-identify checklist")).toBe("checklist");
    expect(archetypeForArtifactType("Student AI-use guidelines")).toBe("checklist");
  });

  it("maps letter-shaped labels", () => {
    expect(archetypeForArtifactType("Parent email")).toBe("letter");
    expect(archetypeForArtifactType("Permission form")).toBe("letter");
  });

  it("maps feedback-list-shaped labels", () => {
    expect(archetypeForArtifactType("Comment bank")).toBe("feedbackList");
    expect(archetypeForArtifactType("Whole-class feedback summary")).toBe("feedbackList");
  });

  it("returns null for Generic-only labels, unknown labels, and null", () => {
    expect(archetypeForArtifactType("Custom")).toBeNull();
    expect(archetypeForArtifactType("Activity idea")).toBeNull();
    expect(archetypeForArtifactType("Some future label nobody mapped yet")).toBeNull();
    expect(archetypeForArtifactType(null)).toBeNull();
    expect(archetypeForArtifactType("constructor")).toBeNull();
    expect(archetypeForArtifactType("toString")).toBeNull();
    expect(archetypeForArtifactType("hasOwnProperty")).toBeNull();
  });
});
