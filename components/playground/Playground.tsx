"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { requestGenerate } from "@/lib/ai/client";
import { saveToToolkit } from "@/app/actions/toolkit";
import type { AiMode } from "@/lib/ai/guardrails";

export function Playground({
  scaffold,
  mode = "playground",
  seedContent,
  context = null,
  onResult,
  allowSave = true,
  artifactType = null,
  lessonId = null,
}: {
  scaffold: string;
  mode?: AiMode;
  seedContent?: string;
  /** Prior material to refine — shown read-only and prepended to the request. */
  context?: string | null;
  onResult?: (text: string, prompt: string) => void;
  allowSave?: boolean;
  artifactType?: string | null;
  lessonId?: string | null;
}) {
  const [prompt, setPrompt] = useState(seedContent ?? scaffold);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<{ msg: string; rate: boolean } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!output || saved) return;
    setSaved(true);
    await saveToToolkit({ prompt, output, artifactType, lessonId });
  }

  async function run() {
    if (busy || !prompt.trim()) return;
    setBusy(true);
    setError(null);
    setOutput(null);
    setSaved(false);
    const userText = context
      ? `Here is my current material:\n\n${context}\n\nNow do this: ${prompt}`
      : prompt;
    const r = await requestGenerate(userText, mode);
    setBusy(false);
    if ("error" in r) {
      setError({ msg: r.error, rate: r.code === "rate_limited" });
      return;
    }
    setOutput(r.text);
    onResult?.(r.text, prompt);
  }

  return (
    <div className="flex flex-col gap-3">
      {context && (
        <div className="rounded-xl border border-line bg-sunk p-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">
            Refining your earlier material
          </p>
          <div className="max-h-40 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed">
            {context}
          </div>
        </div>
      )}
      <p className="text-xs text-muted">
        Tip: keep students&apos; personal details out — no names or private info.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        placeholder="Your instructions to the AI…"
        className="rounded-xl border-[1.5px] border-line-2 bg-surface p-3 text-[14px] leading-relaxed focus-visible:border-brand focus-visible:outline-none"
      />
      <Button
        variant="indigo"
        onClick={run}
        disabled={busy || !prompt.trim()}
        className="w-full"
      >
        {busy ? "Thinking…" : "Generate"}
      </Button>

      {error && (
        <div className="rounded-xl border border-accent bg-accent-soft p-3 text-[14px]">
          <p className="font-bold">
            {error.rate ? "Daily limit reached" : "That didn't go through"}
          </p>
          <p className="mt-1">{error.msg}</p>
          {!error.rate && (
            <button
              onClick={run}
              className="mt-2 font-extrabold text-brand-ink underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {output && (
        <div className="whitespace-pre-wrap rounded-xl border border-line bg-surface p-3 text-[14px] leading-relaxed">
          {output}
        </div>
      )}
      {output && allowSave && (
        <Button
          variant={saved ? "ghost" : "primary"}
          onClick={save}
          disabled={saved}
          className="w-full"
        >
          {saved ? "Saved to Toolkit ✓" : "Save to Toolkit"}
        </Button>
      )}
    </div>
  );
}
