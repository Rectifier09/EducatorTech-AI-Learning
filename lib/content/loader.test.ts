import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getAllLessons, nextLessonId, prevLessonId } from "./loader";

let root: string;

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "sav-content-"));
  mkdirSync(path.join(root, "lessons"));
  writeFileSync(
    path.join(root, "track.json"),
    JSON.stringify({ id: "t", title: "T", lessonIds: ["a", "b"] }),
  );
  const lesson = (id: string) =>
    JSON.stringify({
      id,
      title: id,
      estMinutes: 4,
      goal: "g",
      blocks: [{ type: "theory", id: "x", body: "b" }],
    });
  writeFileSync(path.join(root, "lessons", "a.json"), lesson("a"));
  writeFileSync(path.join(root, "lessons", "b.json"), lesson("b"));
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("content loader", () => {
  it("returns lessons in track order", () => {
    expect(getAllLessons(root).map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("nextLessonId / prevLessonId navigate and terminate", () => {
    expect(nextLessonId("a", root)).toBe("b");
    expect(nextLessonId("b", root)).toBeNull();
    expect(prevLessonId("a", root)).toBeNull();
    expect(prevLessonId("b", root)).toBe("a");
  });
});
