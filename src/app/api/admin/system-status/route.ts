import { NextResponse } from "next/server";
import { getSystemStatusService } from "@/services/google-earth-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = getSystemStatusService().getSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
