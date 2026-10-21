/**
 * PATCH /api/satellite/tramos/propuestas — { traceKey, candidateId, proposed }
 * Marca o desmarca un tramo candidato como "propuesto" para el muestreo.
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { setProposal } from "@/server/satellite/tramos/tramo-finder.service";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  return runRouteHandler(async () => {
    const user = await requirePermission(request, "IMPORT_DATA");
    const body = (await request.json().catch(() => null)) as {
      traceKey?: unknown;
      candidateId?: unknown;
      proposed?: unknown;
    } | null;
    if (
      !body ||
      typeof body.traceKey !== "string" ||
      typeof body.candidateId !== "string" ||
      typeof body.proposed !== "boolean" ||
      body.candidateId.length > 80 ||
      body.traceKey.length > 40
    ) {
      throw ApiError.validation("Se requiere { traceKey, candidateId, proposed }.");
    }
    const mark = await setProposal(body.traceKey, body.candidateId, body.proposed, user.email || user.id);
    return NextResponse.json({ success: true, data: mark });
  });
}
