import { NextResponse } from "next/server";
import { getStationSummaries } from "@/lib/data/simulated";
import { guardPermission } from "@/server/authorization/guards";

/** API stub — Fase 3: conectar con PostgreSQL */
export async function GET(request: Request) {
  const denied = await guardPermission(request, "STATIONS_VIEW");
  if (denied) return denied;

  return NextResponse.json({
    data: getStationSummaries(),
    meta: { source: "simulated", phase: 1 },
  });
}
