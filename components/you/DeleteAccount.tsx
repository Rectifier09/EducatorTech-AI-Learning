"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

function ConfirmButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-coral px-5 py-3 text-[15px] font-extrabold tracking-tight text-paper transition hover:brightness-105 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {pending ? "Deleting…" : "Delete my account"}
    </button>
  );
}

/**
 * Two-step, irreversible account deletion. The first tap only reveals an
 * in-app confirmation (never a native dialog) that spells out exactly what is
 * removed and that it cannot be undone; only the explicit second tap submits
 * the server action. Coral danger styling from the existing @theme palette.
 */
export function DeleteAccount({
  deleteAccount,
}: {
  deleteAccount: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  function cancel() {
    setConfirming(false);
    setConfirmText("");
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mx-auto text-[13px] font-bold text-coral underline underline-offset-4 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Delete profile
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-coral/40 bg-coral/10 p-4">
      <p className="text-[15px] font-bold text-ink">Delete your account?</p>
      <p className="text-[13px] leading-relaxed text-muted">
        This permanently removes your profile, lesson progress, saved work, and
        every record we hold about you.{" "}
        <span className="font-bold text-coral">This cannot be undone.</span>
      </p>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold text-muted">
          Type <span className="text-coral">DELETE</span> to confirm
        </span>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="DELETE"
          aria-label="Type DELETE to confirm account deletion"
          className="rounded-xl border-[1.5px] border-line-2 bg-surface px-3.5 py-2.5 text-[14px] tracking-wide text-ink placeholder:text-faint focus-visible:border-coral focus-visible:outline-none"
        />
      </label>
      <div className="flex gap-2">
        <form action={deleteAccount} className="flex-1">
          <ConfirmButton disabled={!canDelete} />
        </form>
        <Button variant="ghost" type="button" onClick={cancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
