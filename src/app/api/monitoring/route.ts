import { NextResponse } from "next/server";
import { getStationSummaries } from "@/lib/data/simulated";

/** API stub — Fase 3: conectar con PostgreSQL */
export async function GET() {
  return NextResponse.json({
    data: getStationSummaries(),
    meta: { source: "simulated", phase: 1 },
  });
}
