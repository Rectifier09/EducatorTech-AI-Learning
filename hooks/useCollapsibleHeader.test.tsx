import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWindowCollapsibleHeader } from "./useCollapsibleHeader";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    value,
    configurable: true,
  });
}

describe("useWindowCollapsibleHeader", () => {
  afterEach(() => {
    setScrollY(0);
  });

  it("flips to collapsed once window.scrollY passes the enter threshold", () => {
    const { result } = renderHook(() => useWindowCollapsibleHeader());
    expect(result.current).toBe(false);

    act(() => {
      setScrollY(80);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("stays collapsed until scrollY drops below the exit threshold", () => {
    const { result } = renderHook(() => useWindowCollapsibleHeader());

    act(() => {
      setScrollY(80);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    act(() => {
      setScrollY(50);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true); // hysteresis band

    act(() => {
      setScrollY(20);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
  });
});
