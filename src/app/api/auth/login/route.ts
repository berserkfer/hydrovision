/**
 * POST /api/auth/login — { email, password } → cookie de sesión httpOnly.
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { FixedWindowRateLimiter, clientKeyFromRequest } from "@/server/api/rate-limit";
import { loginWithPassword } from "@/server/auth/login.service";
import { setSessionCookie } from "@/server/auth/session-cookie";

export const dynamic = "force-dynamic";

/** 10 intentos por minuto y cliente: frena la fuerza bruta sin molestar al uso normal. */
const loginRateLimiter = new FixedWindowRateLimiter(10, 60_000);

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    const rate = loginRateLimiter.check(clientKeyFromRequest(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Demasiados intentos. Espere un momento." } },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    let body: { email?: unknown; password?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw ApiError.validation("Cuerpo JSON inválido.");
    }

    const result = await loginWithPassword(
      typeof body.email === "string" ? body.email : "",
      typeof body.password === "string" ? body.password : ""
    );

    const response = NextResponse.json({ success: true, data: { user: result.user } });
    setSessionCookie(response, result.token);
    return response;
  });
}
