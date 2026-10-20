import { NextResponse } from "next/server";
import { clientKeyFromRequest, satelliteRateLimiter } from "@/server/api/rate-limit";
import { requirePermission } from "@/server/authorization/guards";
import { fieldTrendService } from "@/server/satellite/trend/field-trend.service";
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
  "thermotolerant_coliforms",
  "nitrates",
  "phosphates",
  "total_dissolved_solids",
  "total_suspended_solids",
  "flow_rate",
]);

export async function GET(request: Request) {
  const rate = satelliteRateLimiter.check(clientKeyFromRequest(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Intenta en unos segundos." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);

    const stationId = searchParams.get("stationId");
    if (!stationId) {
      return NextResponse.json({ error: "stationId es obligatorio" }, { status: 400 });
    }

    const parameterRaw = searchParams.get("parameterCode");
    if (!parameterRaw || !VALID_PARAMETERS.has(parameterRaw)) {
      return NextResponse.json({ error: "parameterCode inválido u obligatorio" }, { status: 400 });
    }

    const horizonRaw = searchParams.get("forecastHorizonDays");
    const forecastHorizonDays = horizonRaw ? Number(horizonRaw) : undefined;

    const data = await fieldTrendService.getTrend({
      stationId,
      parameterCode: parameterRaw as ParametroCodigoDb,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
      forecastHorizonDays:
        forecastHorizonDays !== undefined && Number.isFinite(forecastHorizonDays)
          ? forecastHorizonDays
          : undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al calcular tendencia";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
