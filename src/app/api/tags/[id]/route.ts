import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { patchTagSchema } from "@/lib/schemas";
import { remove } from "@/lib/storage";

// GET /api/tags/:id — perfil del tag (descripción, contactos, fechas, docs).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: {
      contacts: true,
      importantDates: true,
      documents: true,
      _count: { select: { records: true } },
    },
  });
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tag);
}

// PATCH /api/tags/:id — actualizar descripción.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const tag = await prisma.tag.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
    },
  }).catch(() => null);
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tag);
}

// DELETE /api/tags/:id — borra el tag y sus detalles (contactos, fechas, docs).
// Los registros siguen existiendo; solo se desvincula este tag.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: { documents: true },
  });
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Promise.all(
    tag.documents.map((doc) =>
      remove(doc.url).catch((e) => console.error("[tags] remove file", e)),
    ),
  );
  await prisma.tag.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
