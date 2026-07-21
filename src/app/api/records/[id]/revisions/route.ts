import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { recordForAccount } from "@/lib/account-scope";
import { authorFromEmail, listRevisions } from "@/lib/revisions";
import { formatTime } from "@/lib/timezone";

function dayGroup(d: Date, now = new Date()): string {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86_400_000);
  if (diffDays === 0) return "HOY";
  if (diffDays === 1) return "AYER";
  return startThat.toLocaleDateString("es", { day: "numeric", month: "short" }).toUpperCase();
}

function timeLabel(d: Date): string {
  return formatTime(d.toISOString());
}

// GET /api/records/:id/revisions — actual + historial (desc).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id } = await params;
  const existing = await recordForAccount(id, accountId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = await prisma.record.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const author = authorFromEmail(session.user.email);
  let revisions: Awaited<ReturnType<typeof listRevisions>> = [];
  try {
    revisions = await listRevisions(id);
  } catch (err) {
    console.error("[revisions] list failed", err);
  }

  const versions = [
    {
      id: "current",
      timeLabel: timeLabel(record.updatedAt),
      author,
      summary: "versión actual",
      group: dayGroup(record.updatedAt),
      content: record.content,
      createdAt: record.updatedAt.toISOString(),
      isCurrent: true,
    },
    ...revisions.map((r) => ({
      id: r.id,
      timeLabel: timeLabel(r.createdAt),
      author: r.author,
      summary: r.summary,
      group: dayGroup(r.createdAt),
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      isCurrent: false,
    })),
  ];

  return NextResponse.json({ versions, editCount: revisions.length });
}
