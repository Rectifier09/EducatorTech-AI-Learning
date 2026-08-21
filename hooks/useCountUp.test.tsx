import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountUp } from "./useCountUp";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("animates from 0 up to the target", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useCountUp(50));
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current).toBe(50);
  });

  it("jumps immediately to the target when disabled", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useCountUp(50, { enabled: false }));
    expect(result.current).toBe(50);
  });

  it("jumps immediately to the target when reduced motion is preferred", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useCountUp(50));
    expect(result.current).toBe(50);
  });

  it("re-animates to a new target when target changes", () => {
    mockMatchMedia(false);
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target),
      { initialProps: { target: 50 } },
    );
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current).toBe(50);

    rerender({ target: 80 });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current).toBe(80);
  });
});
