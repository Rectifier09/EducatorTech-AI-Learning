import type { ArchetypeId } from "./schema";

const INSTRUCTIONS: Record<ArchetypeId, string> = {
  questionSet:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "instructions": string (optional), ' +
    '"questions": [{"number": integer starting at 1, "prompt": string, ' +
    '"options": string[] (optional — include only for multiple-choice), ' +
    '"answer": string}]}.',
  outline:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "sections": [{"heading": string, ' +
    '"timeEstimate": string (optional, e.g. "10 min"), "bullets": string[]}]}.',
  rubric:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "criteria": [{"name": string, "levels": ' +
    '[{"label": string, "description": string}] (at least 2 levels, ordered ' +
    'low to high)}]}.',
  checklist:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "items": [{"text": string, "note": string ' +
    "(optional)}]}.",
  letter:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "greeting": string (optional), ' +
    '"paragraphs": string[], "signOff": string (optional)}.',
  feedbackList:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "items": [{"label": string (optional), ' +
    '"comment": string}]}.',
};

export function archetypeInstruction(archetype: ArchetypeId): string {
  return INSTRUCTIONS[archetype];
}
