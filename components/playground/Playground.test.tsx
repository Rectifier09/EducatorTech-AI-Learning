import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Playground } from "./Playground";

const requestGenerate = vi.fn();
vi.mock("@/lib/ai/client", () => ({
  requestGenerate: (...args: unknown[]) => requestGenerate(...args),
}));
vi.mock("@/app/actions/toolkit", () => ({ saveToToolkit: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Playground", () => {
  it("calls requestGenerate with an abort signal", async () => {
    requestGenerate.mockReturnValue(new Promise(() => {})); // stays pending
    render(<Playground scaffold="Make a worksheet on [topic]" />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => expect(requestGenerate).toHaveBeenCalled());
    const [, , signal] = requestGenerate.mock.calls[0];
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("shows a Cancel control alongside the disabled Thinking button while busy", async () => {
    requestGenerate.mockReturnValue(new Promise(() => {}));
    render(<Playground scaffold="Make a worksheet on [topic]" />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument(),
    );
    expect(screen.getByText(/^Thinking/)).toBeInTheDocument();
    expect(screen.getByText(/^Thinking/)).toBeDisabled();
  });

  it("cancel aborts the request and returns to idle without showing an error", async () => {
    let capturedSignal: AbortSignal | undefined;
    requestGenerate.mockImplementation(
      (_text: string, _mode: string, signal: AbortSignal) => {
        capturedSignal = signal;
        return new Promise(() => {}); // never resolves in this test
      },
    );
    render(<Playground scaffold="Make a worksheet on [topic]" />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(capturedSignal?.aborted).toBe(true);
    expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled();
    expect(screen.queryByText(/didn't go through/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });
});
