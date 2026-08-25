import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ArtifactCard } from "./ArtifactCard";

const deleteToolkitItem = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/toolkit", () => ({
  deleteToolkitItem: (...args: unknown[]) => deleteToolkitItem(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  deleteToolkitItem.mockResolvedValue(undefined);
});

function renderCard() {
  return render(
    <ArtifactCard
      id="a1"
      title="Worksheet · Fractions"
      output="1. What is 1/2 + 1/4?"
      createdAt="2026-08-20T10:00:00.000Z"
    />,
  );
}

describe("ArtifactCard delete", () => {
  it("does not show Delete on the collapsed card", () => {
    renderCard();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("shows Delete next to Copy once expanded", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("asks for confirmation before deleting, in place", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText(/sure\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
    expect(deleteToolkitItem).not.toHaveBeenCalled();
  });

  it("No cancels back to Copy/Delete without deleting", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(deleteToolkitItem).not.toHaveBeenCalled();
  });

  it("Yes calls deleteToolkitItem with the artifact id and refreshes", async () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(() => expect(deleteToolkitItem).toHaveBeenCalledWith("a1"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
