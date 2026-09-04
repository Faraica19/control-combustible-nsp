import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const RUTAS_PUBLICAS = ["/login"];

const RUTAS_POR_ROL: Record<string, string[]> = {
  "/usuarios": ["ADMIN"],
  "/equipos": ["ADMIN", "BODEGA"],
  "/inventario": ["ADMIN", "BODEGA", "CONSULTA"],
  "/consumo": ["ADMIN", "BODEGA", "CONSULTA"],
  "/reportes": ["ADMIN"],
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublicRoute = RUTAS_PUBLICAS.includes(nextUrl.pathname);

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isLoggedIn) {
    const rol = req.auth?.user?.rol;
    const restriccion = Object.entries(RUTAS_POR_ROL).find(([prefijo]) =>
      nextUrl.pathname.startsWith(prefijo),
    );
    if (restriccion && rol && !restriccion[1].includes(rol)) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
