import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Checklist } from "./Checklist";

describe("Checklist", () => {
  it("renders each item's text and optional note", () => {
    render(
      <Checklist
        data={{
          title: "De-identify Checklist",
          items: [
            { text: "Remove student names", note: "including in filenames" },
            { text: "Blur faces in photos" },
          ],
        }}
      />,
    );
    expect(screen.getByText("De-identify Checklist")).toBeInTheDocument();
    expect(screen.getByText("Remove student names")).toBeInTheDocument();
    expect(screen.getByText("— including in filenames")).toBeInTheDocument();
    expect(screen.getByText("Blur faces in photos")).toBeInTheDocument();
  });
});
