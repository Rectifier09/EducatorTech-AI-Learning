import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteAccount } from "./DeleteAccount";

describe("DeleteAccount", () => {
  it("only shows a trigger first — no confirm, no destructive action exposed", () => {
    render(<DeleteAccount deleteAccount={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Delete profile" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete my account/i }),
    ).not.toBeInTheDocument();
  });

  it("reveals an explicit, irreversible confirmation on the first tap", () => {
    render(<DeleteAccount deleteAccount={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete my account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();
  });

  it("cancel backs out without deleting", () => {
    render(<DeleteAccount deleteAccount={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete profile" }),
    ).toBeInTheDocument();
  });
});
