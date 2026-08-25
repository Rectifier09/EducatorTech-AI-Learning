import { describe, it, expect } from "vitest";
import { archetypeInstruction } from "./prompt";
import { ARCHETYPE_SCHEMAS, type ArchetypeId } from "./schema";

describe("archetypeInstruction", () => {
  it("returns a non-empty JSON-only instruction for every archetype", () => {
    for (const archetype of Object.keys(ARCHETYPE_SCHEMAS) as ArchetypeId[]) {
      const instruction = archetypeInstruction(archetype);
      expect(instruction.length).toBeGreaterThan(0);
      expect(instruction).toMatch(/JSON/);
    }
  });

  it("names the archetype's own field names so the model can match them", () => {
    expect(archetypeInstruction("questionSet")).toMatch(/questions/);
    expect(archetypeInstruction("rubric")).toMatch(/criteria/);
    expect(archetypeInstruction("letter")).toMatch(/paragraphs/);
  });
});
