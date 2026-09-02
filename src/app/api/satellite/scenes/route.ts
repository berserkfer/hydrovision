import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { satelliteService } from "@/server/satellite/satellite.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);
    const filters = {
      stationId: searchParams.get("stationId") ?? undefined,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
      useGee: searchParams.get("useGee") === "true",
    };
    const data = await satelliteService.listScenes(filters);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar escenas";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
