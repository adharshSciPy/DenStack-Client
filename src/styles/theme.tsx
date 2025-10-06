// theme.ts
export function setClinicThemeGradient(theme: {
  start: string; // gradient start color
  end: string;   // gradient end color
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  sidebarForeground?: string;
}) {
  const root = document.documentElement;

  // Store start and end colors for gradient
  root.style.setProperty("--primary", theme.start);
  root.style.setProperty("--primary-end", theme.end);
  root.style.setProperty(
    "--primary-gradient",
    `linear-gradient(135deg, ${theme.start}, ${theme.end})`
  );

  // Optional: secondary colors
  root.style.setProperty("--secondary", theme.secondary || "#3FA796");
  root.style.setProperty(
    "--secondary-foreground",
    theme.secondaryForeground || "#ffffff"
  );

  // Sidebar colors
  root.style.setProperty("--sidebar", `linear-gradient(135deg, ${theme.start}, ${theme.end})`);
  root.style.setProperty(
    "--sidebar-foreground",
    theme.sidebarForeground || "#ffffff"
  );

  // Text color for primary elements
  root.style.setProperty("--primary-foreground", theme.primaryForeground || "#ffffff");
}
