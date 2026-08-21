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
    <div className="flex flex-col gap-4">
      {context && (
        <div className="rounded-2xl border border-line bg-sunk p-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-faint">
            Refining your earlier material
          </p>
          <div className="max-h-40 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
            {context}
          </div>
        </div>
      )}
      <p className="text-xs text-faint">
        Tip: keep students&apos; personal details out — no names or private info.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        placeholder="Your instructions to the AI…"
        className="rounded-2xl border-[1.5px] border-line-2 bg-sunk p-4 text-[15px] leading-relaxed text-ink placeholder:text-faint transition focus-visible:border-brand focus-visible:shadow-[var(--glow-gold)] focus-visible:outline-none"
      />
      <Button
        variant="primary"
        onClick={run}
        disabled={busy || !prompt.trim()}
        className="w-full"
      >
        {busy ? "Thinking…" : "Generate"}
      </Button>

      {error && (
        <div
          className={
            error.rate
              ? "rounded-2xl border border-line-2 bg-surface-2 p-4 text-[14px]"
              : "rounded-2xl border border-coral/40 bg-coral/10 p-4 text-[14px]"
          }
        >
          <p
            className={
              error.rate ? "font-bold text-ink" : "font-bold text-coral"
            }
          >
            {error.rate ? "Daily limit reached" : "That didn't go through"}
          </p>
          <p className="mt-1 text-muted">{error.msg}</p>
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
        <div className="whitespace-pre-wrap rounded-2xl border border-line bg-surface p-4 text-[14px] leading-relaxed text-ink shadow-[var(--elev-1)]">
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
