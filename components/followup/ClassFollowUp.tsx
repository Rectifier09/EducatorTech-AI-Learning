"use client";

import { useState } from "react";
import { answerFollowUp } from "@/app/actions/commitment";

export function ClassFollowUp({ id }: { id: string }) {
  const [answered, setAnswered] = useState<null | "used" | "not">(null);

  async function answer(outcome: "used" | "not") {
    setAnswered(outcome);
    await answerFollowUp(id, outcome);
  }

  if (answered) {
    return (
      <div className="rounded-xl border border-success bg-success-soft p-3 text-[13px] font-bold text-success-ink">
        {answered === "used"
          ? "Love it — that's the whole point. Real help in a real classroom. 🙌"
          : "No stress — thanks for telling us. We'll keep making it easier."}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent bg-accent-soft p-3">
      <p className="text-[14px] font-bold">
        You planned to use what you made in class. Did you?
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => answer("used")}
          className="flex-1 rounded-lg border-[1.5px] border-line-2 bg-surface py-2 text-[14px] font-bold hover:border-brand"
        >
          👍 Used it
        </button>
        <button
          onClick={() => answer("not")}
          className="flex-1 rounded-lg border-[1.5px] border-line-2 bg-surface py-2 text-[14px] font-bold hover:border-brand"
        >
          👎 Not yet
        </button>
      </div>
    </div>
  );
}
