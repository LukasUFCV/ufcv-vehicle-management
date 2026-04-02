import { describe, expect, it } from "vitest";
import { resolveThemePreference } from "./theme.utils";

describe("resolveThemePreference", () => {
  it("utilise le système quand la préférence est auto", () => {
    expect(resolveThemePreference("auto", "dark")).toBe("dark");
    expect(resolveThemePreference("auto", "light")).toBe("light");
  });

  it("priorise la préférence manuelle", () => {
    expect(resolveThemePreference("dark", "light")).toBe("dark");
    expect(resolveThemePreference("light", "dark")).toBe("light");
  });
});
