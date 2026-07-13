import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { passwordHashFromEnvB64 } from "@/lib/password";

/** Si el admin no tiene cuenta de journal, le crea una y la vincula. */
async function ensureAdminAccount(
  admin: { id: string; accountId: string | null },
) {
  if (admin.accountId) return admin;
  const account = await prisma.account.create({ data: {} });
  return prisma.user.update({
    where: { id: admin.id },
    data: { accountId: account.id },
  });
}

/** Crea el admin de plataforma desde env si aún no hay ningún ADMIN. */
export async function ensureBootstrapAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existing) return ensureAdminAccount(existing);

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
        account: { create: {} },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const user = await prisma.user.findUnique({ where: { email } });
      return user ? ensureAdminAccount(user) : null;
    }
    throw err;
  }
}
