import { describe, it, expect } from "vitest";
import { getTrack, getAllLessons } from "./loader";

// Validates the REAL authored content — every lesson in the track parses
// against the schema (getLesson calls validateLesson), ids are unique,
// and block ids are unique within each lesson.
describe("authored content", () => {
  it("every lesson in the track loads + validates", () => {
    const lessons = getAllLessons();
    expect(lessons.length).toBe(getTrack().lessonIds.length);
  });

  it("lesson ids are unique and match the track order", () => {
    const ids = getAllLessons().map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(getTrack().lessonIds);
  });

  it("block ids are unique within each lesson", () => {
    for (const lesson of getAllLessons()) {
      const blockIds = lesson.blocks.map((b) => b.id);
      expect(new Set(blockIds).size, `duplicate block id in ${lesson.id}`).toBe(
        blockIds.length,
      );
    }
  });
});
