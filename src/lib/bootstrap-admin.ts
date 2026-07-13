import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { passwordHashFromEnvB64 } from "@/lib/password";

const LEGACY_ACCOUNT_ID = "legacy-account";

/** Reclama la cuenta legacy/huérfana si existe; si no, crea una vacía. */
async function claimOrCreateAccountId() {
  const legacy = await prisma.account.findFirst({
    where: { id: LEGACY_ACCOUNT_ID, user: null },
  });
  if (legacy) return legacy.id;

  const orphan = await prisma.account.findFirst({
    where: { user: null },
    orderBy: { createdAt: "asc" },
  });
  if (orphan) return orphan.id;

  const created = await prisma.account.create({ data: {} });
  return created.id;
}

/**
 * Si el admin no tiene cuenta, la vincula.
 * Si quedó en una cuenta vacía y legacy huérfana tiene datos, reconecta.
 */
async function ensureAdminAccount(
  admin: { id: string; accountId: string | null },
) {
  if (admin.accountId) {
    const current = await prisma.account.findUnique({
      where: { id: admin.accountId },
      include: { _count: { select: { records: true, tags: true } } },
    });
    const legacy = await prisma.account.findFirst({
      where: { id: LEGACY_ACCOUNT_ID, user: null },
      include: { _count: { select: { records: true, tags: true } } },
    });
    // ponytail: solo repara el caso bootstrap→cuenta vacía vs legacy con datos
    if (
      current &&
      current._count.records === 0 &&
      current._count.tags === 0 &&
      legacy &&
      (legacy._count.records > 0 || legacy._count.tags > 0)
    ) {
      const updated = await prisma.user.update({
        where: { id: admin.id },
        data: { accountId: legacy.id },
      });
      await prisma.account.delete({ where: { id: current.id } });
      return updated;
    }
    return admin;
  }

  const accountId = await claimOrCreateAccountId();
  return prisma.user.update({
    where: { id: admin.id },
    data: { accountId },
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
    const accountId = await claimOrCreateAccountId();
    return await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
        mustChangePassword: false,
        accountId,
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
