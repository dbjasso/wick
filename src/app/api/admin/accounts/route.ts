import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createAccountSchema } from "@/lib/schemas";
import { hashPassword } from "@/lib/password";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accounts = await prisma.account.findMany({
    where: { user: { isNot: null } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
    },
  });

  return NextResponse.json({
    items: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.user?.email ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const account = await prisma.account.create({
    data: {
      name: name || null,
      user: {
        create: {
          email,
          passwordHash,
          role: "MEMBER",
          mustChangePassword: true,
        },
      },
    },
    include: { user: { select: { email: true } } },
  });

  return NextResponse.json(
    {
      id: account.id,
      name: account.name,
      email: account.user?.email ?? null,
      createdAt: account.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
