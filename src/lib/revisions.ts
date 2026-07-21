import { prisma } from "@/lib/prisma";
import { summarizeEdit } from "@/lib/diff-text";
import { extractText } from "@/lib/tiptap-text";

export function authorFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.slice(0, 32);
}

function sameContent(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type RevisionRow = {
  id: string;
  content: unknown;
  summary: string;
  author: string;
  createdAt: Date;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function revDb(): any {
  void prisma.record;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any).recordRevision;
}

/**
 * Checkpoint de sesión: guarda el content actual como versión.
 * Solo al salir de la nota o tras idle largo — no en cada autosave.
 */
export async function commitSessionRevision(opts: {
  recordId: string;
  content: unknown;
  author: string;
  summary?: string;
}): Promise<boolean> {
  try {
    const { recordId, content, author, summary } = opts;
    const rev = revDb();
    if (!rev) {
      console.error("[revisions] recordRevision missing — reinicia el server de Next");
      return false;
    }

    const text = extractText(content).trim();
    if (!text) return false;

    const last = (await rev.findFirst({
      where: { recordId },
      orderBy: { createdAt: "desc" },
      select: { content: true },
    })) as { content: unknown } | null;

    if (last && sameContent(last.content, content)) return false;

    await rev.create({
      data: {
        recordId,
        content: content as never,
        author,
        summary:
          summary ??
          (last ? summarizeEdit(last.content, content) : "creó la entrada"),
      },
    });
    return true;
  } catch (err) {
    console.error("[revisions] commitSession failed", err);
    return false;
  }
}

export async function ensureCreatedRevision(opts: {
  recordId: string;
  content: unknown;
  author: string;
  createdAt?: Date;
}): Promise<void> {
  try {
    const rev = revDb();
    if (!rev) return;
    const count = await rev.count({ where: { recordId: opts.recordId } });
    if (count > 0) return;
    const text = extractText(opts.content).trim();
    if (!text) return;
    await rev.create({
      data: {
        recordId: opts.recordId,
        content: opts.content as never,
        author: opts.author,
        summary: "creó la entrada",
        ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
      },
    });
  } catch (err) {
    console.error("[revisions] ensureCreated failed", err);
  }
}

export async function listRevisions(recordId: string): Promise<RevisionRow[]> {
  const rev = revDb();
  if (!rev) return [];
  return rev.findMany({
    where: { recordId },
    orderBy: { createdAt: "desc" },
  }) as Promise<RevisionRow[]>;
}

export async function findRevision(recordId: string, revId: string): Promise<RevisionRow | null> {
  const rev = revDb();
  if (!rev) return null;
  return rev.findFirst({
    where: { id: revId, recordId },
  }) as Promise<RevisionRow | null>;
}

export async function createRevision(data: {
  recordId: string;
  content: unknown;
  author: string;
  summary: string;
}): Promise<void> {
  const rev = revDb();
  if (!rev) throw new Error("recordRevision missing");
  await rev.create({
    data: {
      recordId: data.recordId,
      content: data.content as never,
      author: data.author,
      summary: data.summary,
    },
  });
}
