export type ThemePreference = "light" | "dark" | "auto";

export function resolveThemePreference(
  preference: ThemePreference,
  systemTheme: "light" | "dark"
) {
  return preference === "auto" ? systemTheme : preference;
}
