import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { AdminAccountsView } from "./AdminAccountsView";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const session = await auth();

  return (
    <AppShell email={session?.user?.email} isAdmin>
      <AdminAccountsView />
    </AppShell>
  );
}
