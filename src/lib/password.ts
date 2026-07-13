import bcrypt from "bcryptjs";

const BCRYPT_COST = 10;

/** Hash bcrypt listo para guardar en User.passwordHash (texto plano, no base64). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Decodifica ADMIN_PASSWORD_HASH (base64) del .env para seed/bootstrap. */
export function passwordHashFromEnvB64(): string {
  const b64 = process.env.ADMIN_PASSWORD_HASH;
  if (!b64) return "";
  return Buffer.from(b64, "base64").toString("utf8");
}
