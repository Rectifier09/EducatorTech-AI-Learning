import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PromptWriteBlockView } from "./PromptWriteBlockView";
import type { PromptWriteBlock } from "@/lib/content/types";

const block: PromptWriteBlock = {
  type: "promptWrite",
  id: "b1",
  brief: "Write a prompt for a worksheet",
  rubric: ["has a task"],
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderBlock() {
  return render(
    <PromptWriteBlockView block={block} onNext={vi.fn()} onResult={vi.fn()} />,
  );
}

function type(submission: string) {
  fireEvent.change(screen.getByPlaceholderText("Write your prompt here…"), {
    target: { value: submission },
  });
}

describe("PromptWriteBlockView", () => {
  it("calls grade-prompt with an abort signal", async () => {
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    renderBlock();
    type("Make a Grade 5 worksheet on fractions");
    fireEvent.click(screen.getByRole("button", { name: "Check my prompt" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("shows a Cancel control alongside the disabled Checking button while busy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    renderBlock();
    type("Make a Grade 5 worksheet on fractions");
    fireEvent.click(screen.getByRole("button", { name: "Check my prompt" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument(),
    );
    expect(screen.getByText(/^Checking/)).toBeInTheDocument();
    expect(screen.getByText(/^Checking/)).toBeDisabled();
  });

  it("cancel aborts the request and returns to idle without a grade", async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        capturedSignal = init?.signal ?? undefined;
        return new Promise(() => {});
      }),
    );
    renderBlock();
    type("Make a Grade 5 worksheet on fractions");
    fireEvent.click(screen.getByRole("button", { name: "Check my prompt" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(capturedSignal?.aborted).toBe(true);
    expect(
      screen.getByRole("button", { name: "Check my prompt" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });
});
