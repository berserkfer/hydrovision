import { NextResponse } from "next/server";
import { clientKeyFromRequest, satelliteRateLimiter } from "@/server/api/rate-limit";
import { requirePermission } from "@/server/authorization/guards";
import {
  PredictionInsufficientDataError,
  predictionService,
} from "@/server/satellite/prediction/prediction.service";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "@/satellite/catalog/spectral-indices.catalog";
import { isApiError } from "@/server/api/errors";

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

const VALID_INDICES = new Set<string>(["NDVI", "NDCI", "NDWI", "MNDWI", "NDTI", "NDMI"]);

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

    const predictorRaw = searchParams.get("predictorIndex");
    if (predictorRaw && !VALID_INDICES.has(predictorRaw)) {
      return NextResponse.json({ error: "predictorIndex inválido" }, { status: 400 });
    }

    const useGeeParam = searchParams.get("useGee");
    const useCopernicusParam = searchParams.get("useCopernicus");
    const usePlanetaryParam = searchParams.get("usePlanetaryComputer");

    const data = await predictionService.predict({
      stationId,
      parameterCode: parameterRaw as ParametroCodigoDb,
      predictorIndex: predictorRaw ? (predictorRaw as SpectralIndexCode) : undefined,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
      useGee: useGeeParam === null ? undefined : useGeeParam === "true",
      useCopernicus: useCopernicusParam === null ? undefined : useCopernicusParam === "true",
      usePlanetaryComputer: usePlanetaryParam === null ? undefined : usePlanetaryParam === "true",
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof PredictionInsufficientDataError) {
      return NextResponse.json(error.payload, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Error al generar predicción";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
