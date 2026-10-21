import { NextResponse } from "next/server";
import { evaluateNormativeRequest } from "@/server/normative/evaluate-normative.service";
import { guardPermission } from "@/server/authorization/guards";

export async function POST(request: Request) {
  const denied = await guardPermission(request, "STATIONS_VIEW");
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 }
    );
  }

  const parsed = body as {
    measurement?: Record<string, unknown>;
    pointType?: string;
    profileId?: string;
  };

  if (!parsed?.measurement || typeof parsed.measurement !== "object") {
    return NextResponse.json(
      { ok: false, error: "Falta el objeto measurement." },
      { status: 400 }
    );
  }

  const result = evaluateNormativeRequest({
    measurement: parsed.measurement,
    pointType: parsed.pointType as never,
    profileId: parsed.profileId,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
