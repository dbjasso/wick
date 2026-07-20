import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { passwordHashFromEnvB64 } from "@/lib/password";

const LEGACY_ACCOUNT_ID = "legacy-account";

/** Mueve records/tags de `fromId` a `toId` y borra la cuenta origen si queda vacía. */
async function mergeAccountInto(fromId: string, toId: string) {
  if (fromId === toId) return;

  await prisma.record.updateMany({
    where: { accountId: fromId },
    data: { accountId: toId },
  });

  const tags = await prisma.tag.findMany({ where: { accountId: fromId } });
  for (const tag of tags) {
    const clash = await prisma.tag.findUnique({
      where: { accountId_name: { accountId: toId, name: tag.name } },
    });
    if (!clash) {
      await prisma.tag.update({
        where: { id: tag.id },
        data: { accountId: toId },
      });
      continue;
    }
    // Mismo nombre en destino: apunta los records al tag existente y borra el duplicado.
    const linked = await prisma.record.findMany({
      where: { tags: { some: { id: tag.id } } },
      select: { id: true },
    });
    for (const r of linked) {
      await prisma.record.update({
        where: { id: r.id },
        data: {
          tags: { disconnect: { id: tag.id }, connect: { id: clash.id } },
        },
      });
    }
    await prisma.tag.delete({ where: { id: tag.id } });
  }

  const left = await prisma.account.findUnique({
    where: { id: fromId },
    include: { _count: { select: { records: true, tags: true } } },
  });
  if (left && left._count.records === 0 && left._count.tags === 0) {
    await prisma.account.delete({ where: { id: fromId } });
  }
}

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
 * Si legacy huérfana tiene más datos que la cuenta actual, reconecta y mergea.
 */
async function ensureAdminAccount(
  admin: { id: string; accountId: string | null },
) {
  if (admin.accountId) {
    if (admin.accountId === LEGACY_ACCOUNT_ID) return admin;

    const current = await prisma.account.findUnique({
      where: { id: admin.accountId },
      include: { _count: { select: { records: true, tags: true } } },
    });
    const legacy = await prisma.account.findFirst({
      where: { id: LEGACY_ACCOUNT_ID, user: null },
      include: { _count: { select: { records: true, tags: true } } },
    });
    const currentN =
      (current?._count.records ?? 0) + (current?._count.tags ?? 0);
    const legacyN =
      (legacy?._count.records ?? 0) + (legacy?._count.tags ?? 0);

    // ponytail: legacy huérfana con más data → reclamar (cubre cuenta vacía o casi vacía post-deploy)
    if (legacy && legacyN > currentN) {
      const updated = await prisma.user.update({
        where: { id: admin.id },
        data: { accountId: legacy.id },
      });
      if (current) await mergeAccountInto(current.id, legacy.id);
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
