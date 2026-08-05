import { NextResponse } from "next/server";
import { getEarthEngineAuthService, getGeeProvider } from "@/services/google-earth-engine";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const authService = getEarthEngineAuthService();
    const result = await authService.testConnection();

    getGeeProvider().getStatus();

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
