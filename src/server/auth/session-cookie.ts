/**
 * Cookie de sesión: httpOnly, SameSite=Lax, Secure fuera de desarrollo, path "/".
 */

import type { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSessionTtlSeconds, isDevelopment } from "./auth.config";

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: !isDevelopment(),
    path: "/",
    maxAge: getSessionTtlSeconds(),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: !isDevelopment(),
    path: "/",
    maxAge: 0,
  });
}
