import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { geeEmpiricalVerificationService } from "@/server/gee/gee-empirical-verification.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);

    const report = await geeEmpiricalVerificationService.runVerification({
      stationId: searchParams.get("stationId") ?? undefined,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
    });

    return NextResponse.json(report);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error en verificación empírica GEE";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
