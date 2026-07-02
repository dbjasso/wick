import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { upload, UploadError } from "@/lib/storage";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: tagId } = await params;

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo (campo 'file')." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { key, size, mimeType } = await upload({
      buffer,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
    });
    const doc = await prisma.document.create({
      data: { filename: file.name, url: key, mimeType, size, tagId },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[documents] upload error", err);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
