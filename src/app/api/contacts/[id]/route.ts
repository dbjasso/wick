import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { contactForAccount } from "@/lib/account-scope";

// DELETE /api/contacts/:id
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
  const contact = await contactForAccount(id, accountId);
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.contact.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
