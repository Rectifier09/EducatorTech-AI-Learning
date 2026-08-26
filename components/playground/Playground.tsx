"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { requestGenerate } from "@/lib/ai/client";
import { saveToToolkit } from "@/app/actions/toolkit";
import type { AiMode } from "@/lib/ai/guardrails";
import { useAnimatedEllipsis } from "@/hooks/useAnimatedEllipsis";
import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";
import { DownloadPdfButton } from "@/components/artifacts/DownloadPdfButton";

export function Playground({
  scaffold,
  mode = "playground",
  seedContent,
  context = null,
  onResult,
  allowSave = true,
  artifactType = null,
  lessonId = null,
  trackId = null,
}: {
  scaffold: string;
  mode?: AiMode;
  seedContent?: string;
  /** Prior material to refine — shown read-only and prepended to the request. */
  context?: string | null;
  onResult?: (
    text: string,
    prompt: string,
    templateType?: string | null,
    structured?: Record<string, unknown> | null,
  ) => void;
  allowSave?: boolean;
  artifactType?: string | null;
  lessonId?: string | null;
  trackId?: string | null;
}) {
  const [prompt, setPrompt] = useState(seedContent ?? scaffold);
  const [output, setOutput] = useState<string | null>(null);
  const [templateType, setTemplateType] = useState<string | null>(null);
  const [structured, setStructured] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<{ msg: string; rate: boolean } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const dots = useAnimatedEllipsis(busy);

  async function save() {
    if (!output || saved) return;
    setSaved(true);
    await saveToToolkit({ prompt, output, artifactType, templateType, structured, lessonId });
  }

  async function run() {
    if (busy || !prompt.trim()) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setError(null);
    setOutput(null);
    setTemplateType(null);
    setStructured(null);
    setSaved(false);
    const userText = context
      ? `Here is my current material:\n\n${context}\n\nNow do this: ${prompt}`
      : prompt;
    const r = await requestGenerate(userText, mode, controller.signal, artifactType, trackId);
    if (controller.signal.aborted) return; // cancelled — UI already reset
    setBusy(false);
    if ("error" in r) {
      setError({ msg: r.error, rate: r.code === "rate_limited" });
      return;
    }
    setOutput(r.text);
    setTemplateType(r.templateType ?? null);
    setStructured(r.structured ?? null);
    onResult?.(r.text, prompt, r.templateType, r.structured);
  }

  function cancel() {
    controllerRef.current?.abort();
    setBusy(false);
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
        {busy ? `Thinking${dots}` : "Generate"}
      </Button>
      {busy && (
        <button
          onClick={cancel}
          className="self-center text-[13px] font-extrabold text-muted underline"
        >
          Cancel
        </button>
      )}

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
        <div className="rounded-2xl border border-line bg-sunk p-4">
          <ArtifactRenderer
            templateType={templateType}
            structured={structured}
            output={output}
          />
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
      {output && (
        <DownloadPdfButton
          templateType={templateType}
          structured={structured}
          output={output}
        />
      )}
    </div>
  );
}
