import { auth } from "@/auth";

export type AccountSession = {
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "MEMBER";
    accountId: string;
    mustChangePassword: boolean;
  };
};

// Helper para proteger API routes. Devuelve la sesión o null; el handler
// decide cómo responder (típicamente 401). Así evitamos que el proxy devuelva
// un redirect (302) sobre una API y podamos mandar 401 limpio.
export async function getSession() {
  const session = await auth();
  return session?.user ? session : null;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

export async function requireAccountSession(): Promise<AccountSession | null> {
  const session = await getSession();
  if (!session?.user.accountId) return null;
  if (session.user.mustChangePassword) return null;
  return session as AccountSession;
}

export function accountIdFrom(session: AccountSession): string {
  return session.user.accountId;
}

export async function getJournalAccountId(): Promise<string | null> {
  const session = await getSession();
  if (!session?.user.accountId || session.user.mustChangePassword) return null;
  return session.user.accountId;
}

export function pendingTodosWhere(accountId: string) {
  return { checked: false as const, record: { accountId } };
}
