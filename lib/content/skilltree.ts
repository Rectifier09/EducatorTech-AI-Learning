import { readFileSync } from "node:fs";
import path from "node:path";

export interface SkillNode {
  id: string;
  label: string;
}
export interface SkillBranch {
  id: string;
  label: string;
  emoji: string;
  nodes: SkillNode[];
}
export interface SkillTreeData {
  gateway: { id: string; label: string; live: boolean };
  branches: SkillBranch[];
}

export function getSkillTree(): SkillTreeData {
  const raw = readFileSync(
    path.join(process.cwd(), "content", "skilltree.json"),
    "utf8",
  );
  return JSON.parse(raw) as SkillTreeData;
}
