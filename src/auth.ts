import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { ipFromHeaders } from "@/lib/get-ip";
import { rateLimit, recordFailed } from "@/lib/auth-rate-limit";
import { base32Decode, verifyTotp } from "@/lib/totp";

// ponytail: leer env en cada authorize(), no a nivel de módulo. Turbopack
// compila auth.ts en bundles distintos (RSC vs route); cachear el hash al
// import rompe el login del form cuando cambia ADMIN_PASSWORD_HASH sin restart.
function adminFromEnv() {
  const email = process.env.ADMIN_EMAIL;
  const hashB64 = process.env.ADMIN_PASSWORD_HASH;
  const passwordHash = hashB64
    ? Buffer.from(hashB64, "base64").toString("utf8")
    : "";
  return { email, passwordHash };
}

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
      // Rate limiting vive acá (punto único): cubre el form Y llamadas
      // directas al callback de NextAuth.
      async authorize(credentials, request) {
        const ip = ipFromHeaders(
          (request?.headers ?? {}) as { get(name: string): string | null },
        );
        if (rateLimit(ip).blocked) {
          console.warn(`[auth] login bloqueado por rate limit ip=${ip}`);
          return null;
        }

        const { email: adminEmail, passwordHash } = adminFromEnv();
        if (!adminEmail || !passwordHash) return null;
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        if (email.trim() !== adminEmail) {
          recordFailed(ip);
          console.warn(`[auth] login fail email incorrecto ip=${ip}`);
          return null;
        }
        const ok = await bcrypt.compare(password, passwordHash);
        if (!ok) {
          recordFailed(ip);
          console.warn(`[auth] login fail password incorrecto ip=${ip}`);
          return null;
        }
        // 2FA: si hay secret configurado, exigir código TOTP válido.
        const totpSecret = totpSecretFromEnv();
        if (totpSecret) {
          const totp = credentials?.totp;
          if (typeof totp !== "string" || !verifyTotp(totp.trim(), totpSecret)) {
            // No sumamos al rate limit de password (factor separado), pero logueamos.
            console.warn(`[auth] login fail TOTP incorrecto ip=${ip}`);
            return null;
          }
        }
        return { id: adminEmail, email: adminEmail };
      },
    }),
  ],
});

