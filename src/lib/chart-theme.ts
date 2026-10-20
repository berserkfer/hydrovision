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
    grid: "#22304d",
    tick: "#7c869b",
    stroke: "#b9c4d6",
    tooltipBg: "#101b31",
    tooltipBorder: "#2b3a5a",
    tooltipText: "#ece8de",
  },
  light: {
    grid: "#e0dcd1",
    tick: "#7c8598",
    stroke: "#0f2347",
    tooltipBg: "#fbfaf6",
    tooltipBorder: "#dedad0",
    tooltipText: "#0e1c36",
  },
};

export function getChartTheme(theme: ThemeMode): ChartThemeColors {
  return CHART_THEMES[theme];
}
