import { ParametersView } from "@/components/parameters/ParametersView";
import {
  getAllParameterRecords,
  getParameterChartData,
  getParameterFilterOptions,
  getParameterSummaryStats,
} from "@/lib/repositories/parameter.repository";

export default function ParametrosPage() {
  const initialRecords = getAllParameterRecords();
  const initialStats = getParameterSummaryStats();
  const chartData = getParameterChartData();
  const { estaciones, campanas, fechas } = getParameterFilterOptions();

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
