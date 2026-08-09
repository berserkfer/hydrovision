import { ParametersView } from "@/components/parameters/ParametersView";
import {
  getAllParameterRecords,
  getParameterChartData,
  getParameterFilterOptions,
  getParameterSummaryStats,
} from "@/lib/api/parameters.client";

export const dynamic = "force-dynamic";

export default async function ParametrosPage() {
  const [initialRecords, initialStats, chartData, filterOptions] = await Promise.all([
    getAllParameterRecords(),
    getParameterSummaryStats(),
    getParameterChartData(),
    getParameterFilterOptions(),
  ]);

  const { estaciones, campanas, fechas } = filterOptions;

  return (
    <ParametersView
      initialRecords={initialRecords}
      initialStats={initialStats}
      chartData={chartData}
      estacionOptions={estaciones}
      campanaOptions={campanas}
      fechaOptions={fechas}
    />
  );
}
