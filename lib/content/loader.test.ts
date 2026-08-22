import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  getTrack,
  getLesson,
  getTrackLessons,
  nextLessonId,
  prevLessonId,
  trackExists,
  getAllTrackIds,
} from "./loader";

let root: string;

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "sav-content-"));
  mkdirSync(path.join(root, "tracks"));
  mkdirSync(path.join(root, "lessons"));

  const writeTrack = (id: string, lessonIds: string[]) => {
    writeFileSync(
      path.join(root, "tracks", `${id}.json`),
      JSON.stringify({ id, title: id.toUpperCase(), lessonIds }),
    );
    mkdirSync(path.join(root, "lessons", id));
    for (const lid of lessonIds) {
      writeFileSync(
        path.join(root, "lessons", id, `${lid}.json`),
        JSON.stringify({
          id: lid,
          title: lid,
          estMinutes: 4,
          goal: "g",
          blocks: [{ type: "theory", id: "x", body: "b" }],
        }),
      );
    }
  };

  // Two independent tracks — proves the loader is track-scoped.
  writeTrack("alpha", ["a", "b"]);
  writeTrack("beta", ["p", "q", "r"]);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("content loader", () => {
  it("getAllTrackIds lists every track (sorted)", () => {
    expect(getAllTrackIds(root)).toEqual(["alpha", "beta"]);
  });

  it("trackExists reflects presence", () => {
    expect(trackExists("alpha", root)).toBe(true);
    expect(trackExists("nope", root)).toBe(false);
  });

  it("getTrack / getTrackLessons return per-track content", () => {
    expect(getTrack("alpha", root).lessonIds).toEqual(["a", "b"]);
    expect(getTrackLessons("beta", root).map((l) => l.id)).toEqual([
      "p",
      "q",
      "r",
    ]);
  });

  it("getLesson loads a lesson from its track directory", () => {
    expect(getLesson("beta", "q", root).id).toBe("q");
  });

  it("nextLessonId / prevLessonId navigate within a track and terminate", () => {
    expect(nextLessonId("alpha", "a", root)).toBe("b");
    expect(nextLessonId("alpha", "b", root)).toBeNull();
    expect(prevLessonId("alpha", "a", root)).toBeNull();
    expect(prevLessonId("beta", "r", root)).toBe("q");
    // ids are scoped to their track — "a" is not part of beta
    expect(nextLessonId("beta", "a", root)).toBeNull();
  });
});
