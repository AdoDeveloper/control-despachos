// src/app/api/location/route.js

import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET;

/**
 * POST /api/location
 * - Solo enlonadores (roleId === 4)
 * - Limpia duplicados, dejando solo el registro más reciente
 * - Actualiza ese registro o crea uno nuevo si no existe
 */
export async function POST(request) {
  // 1) Verificar token y rol
  const token = await getToken({ req: request, secret: SECRET });
  if (!token || token.roleId !== 4) {
    return NextResponse.json(
      { error: "No tienes permiso para enviar ubicación" },
      { status: 403 }
    );
  }

  // 2) Parsear body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { latitude, longitude } = body;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const userId = Number(token.id);

  try {
    // 3) Obtener todos los registros de este usuario
    const all = await prisma.deviceLocation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    });

    if (all.length > 1) {
      // 4) Si hay más de uno, eliminar todos menos el más reciente
      const toDelete = all.slice(1).map(rec => rec.id);
      await prisma.deviceLocation.deleteMany({ where: { id: { in: toDelete } } });
    }

    if (all.length >= 1) {
      // 5a) Actualizar el registro más reciente
      const latest = all[0];
      await prisma.deviceLocation.update({
        where: { id: latest.id },
        data: { latitude, longitude }
      });
    } else {
      // 5b) Si no existía ninguno, crear uno nuevo
      await prisma.deviceLocation.create({
        data: { userId, latitude, longitude }
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error guardando ubicación:", error);
    return NextResponse.json(
      { error: "Error al guardar ubicación" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/location
 * - Solo enlonadores (roleId === 4)
 * - Devuelve la última ubicación registrada
 */
export async function GET(request) {
  // 1) Verificar token y rol
  const token = await getToken({ req: request, secret: SECRET });
  if (!token || token.roleId !== 4) {
    return NextResponse.json(
      { error: "No tienes permiso para ver ubicación" },
      { status: 403 }
    );
  }

  const userId = Number(token.id);

  try {
    // 2) Leer el registro más reciente
    const loc = await prisma.deviceLocation.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { latitude: true, longitude: true, updatedAt: true }
    });

    if (!loc) {
      return NextResponse.json(
        { error: "No se encontró ubicación para este usuario" },
        { status: 404 }
      );
    }

    // 3) Devolver coordenadas
    return NextResponse.json(loc, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo ubicación:", error);
    return NextResponse.json(
      { error: "Error al obtener ubicación" },
      { status: 500 }
    );
  }
}