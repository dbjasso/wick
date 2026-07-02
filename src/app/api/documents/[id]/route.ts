import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getStream, remove, getUrl } from "@/lib/storage";
import { Readable } from "node:stream";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
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
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await remove(doc.url).catch((e) => console.error("[documents] remove file", e));
  await prisma.document.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

// getUrl se expone para que la UI/rutas puedan construir el link de descarga
// sin acoplarse al adaptador concreto.
export { getUrl };
