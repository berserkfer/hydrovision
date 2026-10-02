import { NextResponse } from "next/server";
import { testCopernicusConnection } from "@/server/copernicus/copernicus-oauth.client";
import { satelliteCopernicusService } from "@/server/satellite/satellite-copernicus.service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await testCopernicusConnection();
    await satelliteCopernicusService.getCopernicusStatus();

    return NextResponse.json(result, {
      status: result.success ? 200 : 422,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json(
      {
        success: false,
        simulated: true,
        message,
        testedAt: new Date().toISOString(),
        errors: [message],
      },
      { status: 500 }
    );
  }
}
