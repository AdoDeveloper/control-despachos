// prisma/seed.mjs
import { PrismaClient } from "../src/generated/prisma/client/index.js";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

async function main() {
  // 1️⃣ Upsert roles
  const roles = [
    "Administrador",
    "Supervisor de Despacho",
    "Operador de Bascula",
    "Enlonador",
  ];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`Rol asegurado: ${name}`);
  }

  // 2️⃣ Upsert usuario admin
  const username = "admin";
  const plainPassword = "Admin123!";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const adminRole = await prisma.role.findUnique({
    where: { name: "Administrador" },
  });
  if (!adminRole) throw new Error("Rol Administrador no existe");

  await prisma.user.upsert({
    where: { username },
    update: {
      nombreCompleto: "Administrador Principal",
      codigo: "ADM001",
      email: "admin@example.com",
      password: hashedPassword,
      eliminado: false,
      activo: true,
      roleId: adminRole.id,
    },
    create: {
      username,
      nombreCompleto: "Administrador Principal",
      codigo: "ADM001",
      email: "admin@example.com",
      password: hashedPassword,
      eliminado: false,
      activo: true,
      roleId: adminRole.id,
    },
  });
  console.log("Usuario admin creado o actualizado: admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });