import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnimatedEllipsis } from "./useAnimatedEllipsis";

describe("useAnimatedEllipsis", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is empty when inactive", () => {
    const { result } = renderHook(() => useAnimatedEllipsis(false));
    expect(result.current).toBe("");
  });

  it("cycles through 1, 2, 3 dots and loops back while active", () => {
    const { result } = renderHook(() => useAnimatedEllipsis(true, 400));
    expect(result.current).toBe(".");
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("..");
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("...");
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe(".");
  });

  it("resets to empty when it goes inactive", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useAnimatedEllipsis(active, 400),
      { initialProps: { active: true } },
    );
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("..");
    rerender({ active: false });
    expect(result.current).toBe("");
  });
});
