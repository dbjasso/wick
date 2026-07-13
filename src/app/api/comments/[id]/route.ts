import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { commentForAccount } from "@/lib/account-scope";

// DELETE /api/comments/:id — eliminar un comentario.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id } = await params;
  const comment = await commentForAccount(id, accountId);
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.comment.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
