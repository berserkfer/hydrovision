/**
 * GET /api/vegetation?zone=agricultural_dren4000|lagoon_santa_rosa&date=ISO&threshold=0.4
 * Dos aplicaciones del mismo índice espectral (NDVI/NDCI), un único endpoint que solo cambia
 * la zona geográfica consultada. El umbral de alerta de la laguna es configurable por query
 * param — nunca un valor fijo en el código de negocio.
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { getVegetationIndexForZone } from "@/vegetation/vegetation-index.service";
import { evaluateLagoonVegetationAlert } from "@/vegetation/lagoon-alert.service";
import { interpretNdviVigor } from "@/vegetation/ndvi-interpretation";
import { DEFAULT_LAGOON_ALERT_THRESHOLD } from "@/vegetation/config/vegetation-alert.config";
import { isVegetationZoneId } from "@/vegetation/config/vegetation-zones.config";
import { isApiError } from "@/server/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);

    const zone = searchParams.get("zone");
    const date = searchParams.get("date");

    if (!isVegetationZoneId(zone) || !date) {
      return NextResponse.json(
        { error: "zone (agricultural_dren4000 | lagoon_santa_rosa) y date son obligatorios" },
        { status: 400 }
      );
    }

    const result = await getVegetationIndexForZone(zone, date);

    if (zone === "lagoon_santa_rosa") {
      const thresholdParam = searchParams.get("threshold");
      const parsedThreshold = thresholdParam ? Number(thresholdParam) : NaN;
      const threshold = Number.isFinite(parsedThreshold) ? parsedThreshold : DEFAULT_LAGOON_ALERT_THRESHOLD;
      const alert = evaluateLagoonVegetationAlert(result, threshold);
      return NextResponse.json({ ...result, alert });
    }

    const interpretation = result.found && result.value != null ? interpretNdviVigor(result.value) : null;
    return NextResponse.json({ ...result, interpretation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al calcular el índice de vegetación";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
