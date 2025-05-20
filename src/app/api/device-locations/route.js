// app/api/device-locations/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET;

export async function GET(request) {
  // 1) Sólo administradores y supervisores (roleId === 1 o roleId === 2)
  const token = await getToken({ req: request, secret: SECRET });
  if (!token || (token.roleId !== 1 && token.roleId !== 2)) {
    return NextResponse.json(
      { error: "No tienes permiso para ver ubicaciones" },
      { status: 403 }
    );
  }

  try {
    // 2) Recuperar todas las ubicaciones de los dispositivos
    const locs = await prisma.deviceLocation.findMany({
      include: {
        user: { select: { username: true } }
      }
    });
    return NextResponse.json(locs, { status: 200 });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Error al obtener ubicaciones" },
      { status: 500 }
    );
  }
}