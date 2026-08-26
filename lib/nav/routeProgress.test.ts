import { describe, it, expect, vi, beforeEach } from "vitest";
import { start, done, isLoading, subscribe } from "./routeProgress";

beforeEach(() => {
  vi.useRealTimers();
  done();
});

describe("routeProgress", () => {
  it("is not loading initially", () => {
    expect(isLoading()).toBe(false);
  });

  it("start() sets loading true and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    start();
    expect(isLoading()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("done() sets loading false and notifies subscribers", () => {
    start();
    const listener = vi.fn();
    subscribe(listener);
    done();
    expect(isLoading()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe stops future notifications", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    unsubscribe();
    start();
    expect(listener).not.toHaveBeenCalled();
  });

  it("auto-clears loading if done() is never called (stuck-navigation safety net)", () => {
    vi.useFakeTimers();
    start();
    expect(isLoading()).toBe(true);
    vi.advanceTimersByTime(6000);
    expect(isLoading()).toBe(false);
    vi.useRealTimers();
  });

  it("calling start() again refreshes the safety timeout instead of stacking timers", () => {
    vi.useFakeTimers();
    start();
    vi.advanceTimersByTime(4000);
    start();
    vi.advanceTimersByTime(4000);
    expect(isLoading()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(isLoading()).toBe(false);
    vi.useRealTimers();
  });
});
