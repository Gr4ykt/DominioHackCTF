import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Cookie httpOnly que el backend deja al iniciar sesión (refresh token).
const SESSION_COOKIE = "dhctf_refresh"

// Filtro rápido antes de renderizar: sin cookie de sesión no se entra al
// dashboard. La validez real de la sesión la decide siempre la API.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
