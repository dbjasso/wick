import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { passwordHashFromEnvB64 } from "@/lib/password";

/** Crea el admin de plataforma desde env si aún no hay ningún ADMIN. */
export async function ensureBootstrapAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existing) return existing;

  const email = process.env.ADMIN_EMAIL?.trim();
  const passwordHash = passwordHashFromEnvB64();
  if (!email || !passwordHash) return null;

  try {
    return await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
        mustChangePassword: false,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return prisma.user.findUnique({ where: { email } });
    }
    throw err;
  }
}
