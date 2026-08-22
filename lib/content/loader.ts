import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { validateLesson, type Lesson } from "./schema";

export interface Track {
  id: string;
  title: string;
  lessonIds: string[];
}

/** Canonical id of the foundations (gateway) track. */
export const FOUNDATIONS_TRACK_ID = "ai-foundations";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function trackFile(trackId: string, root: string): string {
  return path.join(root, "tracks", `${trackId}.json`);
}

export function trackExists(
  trackId: string,
  root: string = CONTENT_ROOT,
): boolean {
  return existsSync(trackFile(trackId, root));
}

export function getAllTrackIds(root: string = CONTENT_ROOT): string[] {
  const dir = path.join(root, "tracks");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .sort();
}

export function getTrack(trackId: string, root: string = CONTENT_ROOT): Track {
  const raw = readFileSync(trackFile(trackId, root), "utf8");
  return JSON.parse(raw) as Track;
}

export function getLesson(
  trackId: string,
  lessonId: string,
  root: string = CONTENT_ROOT,
): Lesson {
  const raw = readFileSync(
    path.join(root, "lessons", trackId, `${lessonId}.json`),
    "utf8",
  );
  return validateLesson(JSON.parse(raw));
}

export function getTrackLessons(
  trackId: string,
  root: string = CONTENT_ROOT,
): Lesson[] {
  return getTrack(trackId, root).lessonIds.map((id) =>
    getLesson(trackId, id, root),
  );
}

export function nextLessonId(
  trackId: string,
  lessonId: string,
  root: string = CONTENT_ROOT,
): string | null {
  const ids = getTrack(trackId, root).lessonIds;
  const i = ids.indexOf(lessonId);
  return i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
}

export function prevLessonId(
  trackId: string,
  lessonId: string,
  root: string = CONTENT_ROOT,
): string | null {
  const ids = getTrack(trackId, root).lessonIds;
  const i = ids.indexOf(lessonId);
  return i > 0 ? ids[i - 1] : null;
}
