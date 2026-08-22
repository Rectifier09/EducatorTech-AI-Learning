import { describe, it, expect } from "vitest";
import { getAllTrackIds, getTrack, getTrackLessons } from "./loader";

// Validates the REAL authored content across every track: each track loads,
// every lesson parses against the schema (getLesson calls validateLesson),
// lesson ids are unique within a track and match the track order, and block
// ids are unique within each lesson.
describe("authored content", () => {
  const trackIds = getAllTrackIds();

  it("has at least one track (incl. ai-foundations)", () => {
    expect(trackIds.length).toBeGreaterThan(0);
    expect(trackIds).toContain("ai-foundations");
  });

  it.each(trackIds)("track %s loads + every lesson validates", (trackId) => {
    const track = getTrack(trackId);
    const lessons = getTrackLessons(trackId);
    expect(lessons.length).toBe(track.lessonIds.length);
  });

  it.each(trackIds)(
    "track %s: lesson ids are unique and match track order",
    (trackId) => {
      const track = getTrack(trackId);
      const ids = getTrackLessons(trackId).map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual(track.lessonIds);
    },
  );

  it.each(trackIds)(
    "track %s: block ids are unique within each lesson",
    (trackId) => {
      for (const lesson of getTrackLessons(trackId)) {
        const blockIds = lesson.blocks.map((b) => b.id);
        expect(
          new Set(blockIds).size,
          `duplicate block id in ${trackId}/${lesson.id}`,
        ).toBe(blockIds.length);
      }
    },
  );
});
