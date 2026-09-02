import type { ThemeMode } from "@/providers/ThemeProvider";

export interface ChartThemeColors {
  grid: string;
  tick: string;
  stroke: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

const CHART_THEMES: Record<ThemeMode, ChartThemeColors> = {
  dark: {
    grid: "#1e3a5f",
    tick: "#7c8fa8",
    stroke: "#22d3ee",
    tooltipBg: "#0f1b2d",
    tooltipBorder: "#243b5c",
    tooltipText: "#e8f0fa",
  },
  light: {
    grid: "#e2e8f0",
    tick: "#64748b",
    stroke: "#0891b2",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e2e8f0",
    tooltipText: "#0f172a",
  },
};

export function getChartTheme(theme: ThemeMode): ChartThemeColors {
  return CHART_THEMES[theme];
}
