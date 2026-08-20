import { describe, it, expect } from "vitest";
import { APP_NAME } from "./config";

describe("config", () => {
  it("exposes the working product name", () => {
    expect(APP_NAME).toBe("SahajAiVidya");
  });
});
