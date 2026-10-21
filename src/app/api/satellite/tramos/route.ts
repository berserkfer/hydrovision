/**
 * Buscador de tramos aptos para Sentinel-2 — resultado guardado, cálculo en segundo plano.
 *
 * GET  /api/satellite/tramos[?format=csv]  último resultado + estado + propuestas (no calcula)
 * POST /api/satellite/tramos               lanza el cálculo en segundo plano
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { getJobState, getLatestResult, startJob } from "@/server/jobs/background-jobs";
import {
  TRAMO_FINDER_JOB,
  getProposals,
  getStoredTrace,
  runTramoFinder,
  tramoCandidatesToCsv,
  type TramoFinderResult,
} from "@/server/satellite/tramos/tramo-finder.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_VIEW");
    const [state, latest, proposals, trace] = await Promise.all([
      getJobState(TRAMO_FINDER_JOB),
      getLatestResult<TramoFinderResult>(TRAMO_FINDER_JOB),
      getProposals(),
      getStoredTrace(),
    ]);

    if (new URL(request.url).searchParams.get("format") === "csv") {
      if (!latest) throw ApiError.notFound("Resultado del buscador de tramos");
      return new NextResponse(tramoCandidatesToCsv(latest.result, proposals), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="tramos-aptos-${latest.computedAt.slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        state,
        latest,
        proposals,
        uploadedTrace: trace ? { name: trace.name, uploadedAt: trace.uploadedAt, hash: trace.hash } : null,
      },
    });
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    const user = await requirePermission(request, "IMPORT_DATA");
    const { started, state } = await startJob(
      TRAMO_FINDER_JOB,
      (report) => runTramoFinder({ onProgress: report }),
      { requestedBy: user.email || user.id }
    );
    return NextResponse.json({ success: true, data: { started, state } }, { status: started ? 202 : 200 });
  });
}
