/**
 * Protección de páginas: sin sesión válida → /login (salvo en desarrollo, donde existe el
 * usuario simulado). Aquí solo se verifica la firma y la expiración de la cookie; las rutas
 * API además cargan el usuario de la base y verifican su rol y estado en cada petición.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isDevelopment } from "@/server/auth/auth.config";
import { verifySessionToken } from "@/server/auth/session";

export async function middleware(request: NextRequest) {
  if (isDevelopment()) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Todo excepto: API (se protege en cada ruta), la propia página de login, los recursos de
  // Next y los archivos públicos de la PWA.
  matcher: ["/((?!api/|login|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons/|examples/).*)"],
};
