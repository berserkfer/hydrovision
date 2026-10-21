import { NextResponse } from "next/server";
import { clientKeyFromRequest, satelliteRateLimiter } from "@/server/api/rate-limit";
import { requirePermission } from "@/server/authorization/guards";
import { satelliteService } from "@/server/satellite/satellite.service";
import { isApiError } from "@/server/api/errors";

export const dynamic = "force-dynamic";

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
    const filters = {
      stationId: searchParams.get("stationId") ?? undefined,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
      useGee: searchParams.get("useGee") === "true",
      useCopernicus: searchParams.get("useCopernicus") === "true",
      usePlanetaryComputer: searchParams.get("usePlanetaryComputer") === "true",
    };
    const data = await satelliteService.listScenes(filters);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar escenas";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
