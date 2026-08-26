import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { RouteProgressBar } from "./RouteProgressBar";
import { done as storeDone } from "@/lib/nav/routeProgress";

let mockPathname = "/learn";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

function bar() {
  return screen.getByTestId("route-progress-bar");
}

function fill() {
  return screen.getByTestId("route-progress-fill");
}

beforeEach(() => {
  mockPathname = "/learn";
  storeDone();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RouteProgressBar", () => {
  it("is hidden on initial render", () => {
    render(<RouteProgressBar />);
    expect(bar()).toHaveStyle({ opacity: "0" });
  });

  it("becomes visible when a client-side navigation starts (history.pushState)", () => {
    render(<RouteProgressBar />);
    act(() => {
      window.history.pushState({}, "", "/create");
    });
    expect(bar()).toHaveStyle({ opacity: "1" });
    expect(parseFloat(fill().style.width)).toBeGreaterThan(0);
  });

  it("hides again once the pathname commits to the new route", () => {
    const { rerender } = render(<RouteProgressBar />);
    act(() => {
      window.history.pushState({}, "", "/create");
    });
    expect(bar()).toHaveStyle({ opacity: "1" });

    vi.useFakeTimers();
    mockPathname = "/create";
    rerender(<RouteProgressBar />);
    // done() snaps to 100% immediately, then fades out after a short delay.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(bar()).toHaveStyle({ opacity: "0" });
  });

  it("does not fire done() on the very first render (no navigation happened yet)", () => {
    render(<RouteProgressBar />);
    expect(bar()).toHaveStyle({ opacity: "0" });
  });
});
