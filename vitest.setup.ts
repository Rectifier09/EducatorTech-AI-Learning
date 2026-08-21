import "@testing-library/jest-dom/vitest";

// jsdom does not implement matchMedia. Provide a default (non-matching)
// stub so components/hooks that read prefers-reduced-motion etc. don't
// throw; individual tests can override window.matchMedia to simulate a
// specific media query result.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
