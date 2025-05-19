import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { createClient } from "@supabase/supabase-js";

const rateLimiter = new RateLimiterMemory({ points: 5, duration: 30 });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sincroniza estado de sesión en Supabase: online u offline, guardando también el rol
async function syncUserSessionSupabase(user, status = "online") {
  if (!user?.id) return;
  const { error } = await supabase
    .from("user_sessions_supabase")
    .upsert(
      {
        external_user_id: user.id,
        username: user.username,
        role_id: user.roleId,
        role_name: user.roleName,
        last_active: new Date().toISOString(),
        status,
      },
      { onConflict: "external_user_id" }
    );
  if (error) console.error("Supabase sync error:", error);
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        try {
          await rateLimiter.consume(ip);
        } catch {
          throw new Error("Demasiados intentos. Intenta más tarde.");
        }
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Usuario o contraseña inválidos");
        }

        const username = credentials.username.trim();
        const user = await prisma.user.findUnique({
          where: { username },
          include: { role: true },
        });

        const hash = user?.password ?? "$2a$10$C6UzMDM.H6dfI/f/IKcEeO";
        const valid = await bcrypt.compare(credentials.password, hash);
        if (!user || !valid || user.eliminado || !user.activo) {
          throw new Error("Usuario o contraseña inválidos");
        }

        await rateLimiter.delete(ip);

        // Marca al usuario como "online" y guarda su rol
        await syncUserSessionSupabase(
          {
            id: user.id,
            username: user.username,
            roleId: user.roleId,
            roleName: user.role?.name,
          },
          "online"
        );

        return {
          id: user.id,
          username: user.username,
          roleId: user.roleId,
          roleName: user.role?.name,
          codigo: user.codigo,
          nombreCompleto: user.nombreCompleto,
          email: user.email,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60,
  },

  jwt: {
    maxAge: 12 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) Object.assign(token, user);
      return token;
    },
    async session({ session, token }) {
      session.user = token;
      return session;
    },
  },

  events: {
    // Cuando el usuario cierra sesión o expira
    async signOut({ token }) {
      await syncUserSessionSupabase(
        {
          id: token.id,
          username: token.username,
          roleId: token.roleId,
          roleName: token.roleName,
        },
        "offline"
      );
    },
    async error({ error, method }) {
      console.warn(`[next-auth][${method}]`, error);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};