import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { getToken } from "next-auth/jwt";

export async function GET(request, { params }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para acceder a este endpoint" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      include: { role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para actualizar este usuario" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { username, nombreCompleto, codigo, email, password, roleId, activo } = body;
    const data = { username, nombreCompleto, codigo, email, roleId };

    if (password && password.trim() !== "") {
      data.password = await bcrypt.hash(password, 10);
    }

    if (typeof activo !== "undefined") {
      data.activo = activo;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      include: { role: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Si hay cambio de rol o de activo en un admin único, bloquear
    if (currentUser.roleId === 1) {
      const adminCount = await prisma.user.count({
        where: { roleId: 1, activo: true, eliminado: false },
      });
      if (adminCount <= 1) {
        // si intenta desactivar
        if (data.activo === false) {
          return NextResponse.json(
            { error: "No se puede desactivar porque solo hay un usuario administrador activo" },
            { status: 400 }
          );
        }
        // si intenta cambiar rol fuera de admin
        if (data.roleId !== 1) {
          return NextResponse.json(
            { error: "No se puede cambiar el rol porque solo hay un usuario administrador activo" },
            { status: 400 }
          );
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data,
      include: { role: true },
    });
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.roleId !== 1) {
    return NextResponse.json(
      { error: "No tienes permiso para eliminar este usuario" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (currentUser.roleId === 1) {
      const adminCount = await prisma.user.count({
        where: { roleId: 1, activo: true, eliminado: false },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede eliminar porque solo hay un usuario administrador activo" },
          { status: 400 }
        );
      }
    }

    const deletedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: {
        eliminado: true,
        activo: false,
      },
    });
    return NextResponse.json(deletedUser, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}