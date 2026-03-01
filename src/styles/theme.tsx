// src/styles/theme.ts
export function setClinicThemeGradient({
  background,
  isDark,
}: {
  background: string;
  isDark: boolean;
}) {
  const root = document.documentElement;

  root.style.setProperty("--clinic-bg", background);
  root.style.setProperty(
    "--clinic-text",
    isDark ? "#f9fafb" : "#111827"
  );
}