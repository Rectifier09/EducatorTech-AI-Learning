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

  it("keeps the destructive button disabled until DELETE is typed", () => {
    render(<DeleteAccount deleteAccount={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
    const confirm = screen.getByRole("button", { name: /delete my account/i });
    const input = screen.getByLabelText(/type delete to confirm/i);

    expect(confirm).toBeDisabled();
    fireEvent.change(input, { target: { value: "nope" } });
    expect(confirm).toBeDisabled();
    fireEvent.change(input, { target: { value: "delete" } });
    expect(confirm).toBeEnabled(); // case-insensitive, trimmed
  });

  it("cancel backs out without deleting and clears the typed text", () => {
    render(<DeleteAccount deleteAccount={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), {
      target: { value: "DELETE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
    // reopening starts fresh (button disabled again)
    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
    expect(
      screen.getByRole("button", { name: /delete my account/i }),
    ).toBeDisabled();
  });
});
