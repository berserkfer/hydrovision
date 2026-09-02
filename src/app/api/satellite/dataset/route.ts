import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { scientificDatasetService } from "@/server/satellite/validation/scientific-dataset.service";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";

export const dynamic = "force-dynamic";

const VALID_PARAMETERS = new Set<string>([
  "ph",
  "turbidity",
  "conductivity",
  "dissolved_oxygen",
  "temperature",
  "bod5",
  "cod",
  "coliforms",
  "nitrates",
  "phosphates",
  "total_dissolved_solids",
  "flow_rate",
]);

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);

    const stationId = searchParams.get("stationId");
    if (!stationId) {
      return NextResponse.json({ error: "stationId es obligatorio" }, { status: 400 });
    }

    const parameterRaw = searchParams.get("parameterCode");
    const parameterCode =
      parameterRaw && VALID_PARAMETERS.has(parameterRaw)
        ? (parameterRaw as ParametroCodigoDb)
        : undefined;

    const includeSimulatedParam = searchParams.get("includeSimulated");
    const includeSimulated =
      includeSimulatedParam === "true"
        ? true
        : includeSimulatedParam === "false"
          ? false
          : false;

    const data = await scientificDatasetService.buildDataset({
      stationId,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
      parameterCode,
      useGee: searchParams.get("useGee") === "true",
      includeSimulated,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al construir dataset científico";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
