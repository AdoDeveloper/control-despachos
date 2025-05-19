// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// 1) Definición de roles en español
const ROLES = {
  ADMINISTRADOR: 1,
  SUPERVISOR_DESPACHOS: 2,
  OPERADOR_BASCULA: 3,
  ENLONADOR: 4,
};

// 2) Rutas públicas (no requieren auth)
const PUBLIC_ROUTES = [
  "/login",
  "/api/auth",
  "/health",
  "/api/health",
];

// 3) Grupos de permisos
const PERMISSIONS = {
  AUTHENTICATED: [], // cualquier usuario autenticado
  ADMIN_ONLY: [ROLES.ADMINISTRADOR],
  OP_ASSISTANT: [ROLES.ADMINISTRADOR, ROLES.SUPERVISOR_DESPACHOS],
  MUELLERO: [ROLES.ADMINISTRADOR, ROLES.OPERADOR_BASCULA],
  EQUIPOS: [ROLES.ADMINISTRADOR, ROLES.OPERADOR_BASCULA],
  RECEPCION_FULL: [ROLES.ADMINISTRADOR],
  RECEPCION_LIMITED: [ROLES.ADMINISTRADOR],
  ACONTECIMIENTOS: [ROLES.ADMINISTRADOR, ROLES.SUPERVISOR_DESPACHOS],
};

// 4) Definición de permisos por ruta
const ROUTE_PERMISSIONS = {
  // Globales
  "/": PERMISSIONS.AUTHENTICATED,
  "/perfil": PERMISSIONS.AUTHENTICATED,
  "/proceso/iniciar": PERMISSIONS.AUTHENTICATED,
  "/building": PERMISSIONS.AUTHENTICATED,

  // ADMIN
  "/usuarios": PERMISSIONS.ADMIN_ONLY,
  "/api/users": PERMISSIONS.ADMIN_ONLY,
  "/api/users/:path*": PERMISSIONS.ADMIN_ONLY,
  "/api/roles": PERMISSIONS.ADMIN_ONLY,
  "/api/roles/:path*": PERMISSIONS.ADMIN_ONLY,
};

// 5) Headers de seguridad
const SecurityHeaders = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
function applySecurityHeaders(res) {
  Object.entries(SecurityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

// 6) Helper para coincidencia de rutas (soporta :path*)
function matchRoute(path, pattern) {
  if (pattern.includes(":path*")) {
    return path.startsWith(pattern.replace("/:path*", ""));
  }
  return path === pattern;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Aplica cabeceras de seguridad siempre
  let response = NextResponse.next();
  applySecurityHeaders(response);

  // Rutas públicas
  if (PUBLIC_ROUTES.some(route => matchRoute(pathname, route))) {
    return response;
  }

  // Obtener token de NextAuth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Not authenticated", message: "Authentication required" },
        { status: 401 }
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "authorize=SessionRequired";
    return NextResponse.redirect(loginUrl);
  }

  // Verificación de permisos
  const routeKey = Object.keys(ROUTE_PERMISSIONS).find(route =>
    matchRoute(pathname, route)
  );
  const allowedRoles = routeKey ? ROUTE_PERMISSIONS[routeKey] : null;

  if (!allowedRoles) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Access denied" },
        { status: 403 }
      );
    }
    const forbiddenUrl = req.nextUrl.clone();
    forbiddenUrl.pathname = "/403";
    return NextResponse.redirect(forbiddenUrl);
  }

  // Permitir si es cualquier autenticado o incluye el rol
  if (allowedRoles.length === 0 || allowedRoles.includes(token.roleId)) {
    return response;
  }

  // Acceso denegado
  if (pathname.startsWith("/api")) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Access denied" },
      { status: 403 }
    );
  } else {
    const forbiddenUrl = req.nextUrl.clone();
    forbiddenUrl.pathname = "/403";
    return NextResponse.redirect(forbiddenUrl);
  }
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/health",
    "/api/health",
    "/perfil",
    "/building",
    "/api/analysis",
    "/proceso/analisis",

    // SOPORTE
    "/api/tickets",
    "/api/tickets/:path*",
    "/api/chat/:path*",
    "/api/chat/delivered",
    "/api/chat/estatus",
    "/api/chat/messages/:path*",
    "/api/chat/read",
    "/api/chat/send",
    "/soporte",
    "/soporte/chat",
    "/soporte/chat/:path*",

    // ADMIN
    "/usuarios",
    "/api/users/:path*",
    "/api/roles/:path*",
    "/api/users",
    "/api/roles",
  ],
};