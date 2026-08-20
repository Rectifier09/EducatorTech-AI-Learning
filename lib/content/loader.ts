import { readFileSync } from "node:fs";
import path from "node:path";
import { validateLesson, type Lesson } from "./schema";

export interface Track {
  id: string;
  title: string;
  lessonIds: string[];
}

const CONTENT_ROOT = path.join(process.cwd(), "content");

export function getTrack(root: string = CONTENT_ROOT): Track {
  const raw = readFileSync(path.join(root, "track.json"), "utf8");
  return JSON.parse(raw) as Track;
}

export function getLesson(id: string, root: string = CONTENT_ROOT): Lesson {
  const raw = readFileSync(path.join(root, "lessons", `${id}.json`), "utf8");
  return validateLesson(JSON.parse(raw));
}

export function getAllLessons(root: string = CONTENT_ROOT): Lesson[] {
  return getTrack(root).lessonIds.map((id) => getLesson(id, root));
}

export function nextLessonId(id: string, root: string = CONTENT_ROOT): string | null {
  const ids = getTrack(root).lessonIds;
  const i = ids.indexOf(id);
  return i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
}

export function prevLessonId(id: string, root: string = CONTENT_ROOT): string | null {
  const ids = getTrack(root).lessonIds;
  const i = ids.indexOf(id);
  return i > 0 ? ids[i - 1] : null;
}
