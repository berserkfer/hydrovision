/**
 * POST /api/auth/logout — borra la cookie de sesión.
 */

import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/auth/session-cookie";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
