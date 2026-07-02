import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { ipFromHeaders } from "@/lib/get-ip";
import { rateLimit, recordFailed } from "@/lib/auth-rate-limit";
import { base32Decode, verifyTotp } from "@/lib/totp";

// Usuario único definido por variables de entorno (no hay registro abierto).
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
// El hash bcrypt contiene `$2b$10$...` y dotenv-expand lo corrompería al
// cargar el .env (expande `$var`). Lo almacenamos base64-encoded (sin `$`)
// y lo decodificamos acá.
const ADMIN_PASSWORD_HASH_B64 = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH_B64
  ? Buffer.from(ADMIN_PASSWORD_HASH_B64, "base64").toString("utf8")
  : "";

// 2FA TOTP opcional: si ADMIN_TOTP_SECRET (base32) está seteado, el login
// requiere además un código TOTP de 6 dígitos.
const ADMIN_TOTP_SECRET_B32 = process.env.ADMIN_TOTP_SECRET
  ? process.env.ADMIN_TOTP_SECRET.replace(/\s/g, "")
  : "";
const ADMIN_TOTP_SECRET = ADMIN_TOTP_SECRET_B32
  ? base32Decode(ADMIN_TOTP_SECRET_B32)
  : null;

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

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) return null;
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        if (email !== ADMIN_EMAIL) {
          recordFailed(ip);
          console.warn(`[auth] login fail email incorrecto ip=${ip}`);
          return null;
        }
        const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!ok) {
          recordFailed(ip);
          console.warn(`[auth] login fail password incorrecto ip=${ip}`);
          return null;
        }
        // 2FA: si hay secret configurado, exigir código TOTP válido.
        if (ADMIN_TOTP_SECRET) {
          const totp = credentials?.totp;
          if (typeof totp !== "string" || !verifyTotp(totp.trim(), ADMIN_TOTP_SECRET)) {
            // No sumamos al rate limit de password (factor separado), pero logueamos.
            console.warn(`[auth] login fail TOTP incorrecto ip=${ip}`);
            return null;
          }
        }
        return { id: ADMIN_EMAIL, email: ADMIN_EMAIL };
      },
    }),
  ],
});

