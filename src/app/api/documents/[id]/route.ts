import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { getStream, remove, getUrl } from "@/lib/storage";
import { documentForAccount } from "@/lib/account-scope";
import { Readable } from "node:stream";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id } = await params;
  const doc = await documentForAccount(id, accountId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stream = Readable.toWeb(getStream(doc.url)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${doc.filename.replace(/"/g, "")}"`,
      "Content-Length": String(doc.size),
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id } = await params;
  const doc = await documentForAccount(id, accountId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await remove(doc.url).catch((e) => console.error("[documents] remove file", e));
  await prisma.document.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

// getUrl se expone para que la UI/rutas puedan construir el link de descarga
// sin acoplarse al adaptador concreto.
export { getUrl };
