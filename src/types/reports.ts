export interface ReportOptions {
  stationIds: string[];
  startDate: string;
  endDate: string;
  includeSatellite: boolean;
  includeCompliance: boolean;
}

export interface ReportResult {
  success: boolean;
  message: string;
  fileUrl?: string;
  generatedAt?: string;
}

export interface ExcelExportOptions {
  campanaId?: string;
  startDate: string;
  endDate: string;
  includeParameters: boolean;
}

export interface StatisticsQuery {
  rioId?: string;
  cuencaId?: string;
  startDate: string;
  endDate: string;
  groupBy: "day" | "week" | "month" | "station";
}

export interface StatisticsResult {
  labels: string[];
  series: { name: string; values: number[] }[];
  generatedAt: string;
}
