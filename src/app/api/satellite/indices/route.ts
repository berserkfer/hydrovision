import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { satelliteService } from "@/server/satellite/satellite.service";
import { isApiError } from "@/server/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const data = await satelliteService.getIndicesCatalog();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener catálogo de índices";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
