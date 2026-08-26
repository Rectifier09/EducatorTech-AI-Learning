import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Letter } from "./Letter";

describe("Letter", () => {
  it("renders greeting, paragraphs, and sign-off when present", () => {
    render(
      <Letter
        data={{
          title: "Parent Email",
          greeting: "Dear families,",
          paragraphs: ["We have a field trip next week."],
          signOff: "Warmly, Ms. Rao",
        }}
      />,
    );
    expect(screen.getByText("Dear families,")).toBeInTheDocument();
    expect(screen.getByText("We have a field trip next week.")).toBeInTheDocument();
    expect(screen.getByText("Warmly, Ms. Rao")).toBeInTheDocument();
  });

  it("omits greeting and sign-off when absent", () => {
    render(<Letter data={{ title: "Notice", paragraphs: ["School closes early Friday."] }} />);
    expect(screen.getByText("School closes early Friday.")).toBeInTheDocument();
  });
});
