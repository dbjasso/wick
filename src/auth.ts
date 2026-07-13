import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { ipFromHeaders } from "@/lib/get-ip";
import { rateLimit, recordFailed } from "@/lib/auth-rate-limit";
import { base32Decode, verifyTotp } from "@/lib/totp";
import { prisma } from "@/lib/prisma";
import { ensureBootstrapAdmin } from "@/lib/bootstrap-admin";

const bootstrapOnce = ensureBootstrapAdmin();

function totpSecretFromEnv() {
  const b32 = process.env.ADMIN_TOTP_SECRET?.replace(/\s/g, "") ?? "";
  return b32 ? base32Decode(b32) : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "Código 2FA", type: "text" },
      },
      async authorize(credentials, request) {
        await bootstrapOnce;

        const ip = ipFromHeaders(
          (request?.headers ?? {}) as { get(name: string): string | null },
        );
        if (rateLimit(ip).blocked) {
          console.warn(`[auth] login bloqueado por rate limit ip=${ip}`);
          return null;
        }

        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.trim() },
        });
        if (!user) {
          recordFailed(ip);
          console.warn(`[auth] login fail email incorrecto ip=${ip}`);
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          recordFailed(ip);
          console.warn(`[auth] login fail password incorrecto ip=${ip}`);
          return null;
        }

        if (user.role === "ADMIN") {
          const totpSecret = totpSecretFromEnv();
          if (totpSecret) {
            const totp = credentials?.totp;
            if (typeof totp !== "string" || !verifyTotp(totp.trim(), totpSecret)) {
              console.warn(`[auth] login fail TOTP incorrecto ip=${ip}`);
              return null;
            }
          }
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          accountId: user.accountId,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      // Reusa el jwt de auth.config (user → token) y aplica updates de sesión.
      const base = authConfig.callbacks.jwt;
      const token =
        typeof base === "function" ? await base(params) : params.token;
      const { trigger, session } = params;
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { mustChangePassword?: boolean };
        if (s.mustChangePassword === false) {
          token.mustChangePassword = false;
        }
      }
      // Admin: sincronizar accountId (bootstrap / reclamo de legacy).
      if (token.role === "ADMIN" && token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { accountId: true },
        });
        if (user) token.accountId = user.accountId;
      }
      return token;
    },
  },
});
