"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AccountRow = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
};

export function AdminAccountsView() {
  const [items, setItems] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/accounts");
    if (!res.ok) {
      setError("No se pudieron cargar las cuentas.");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { items: AccountRow[] };
    setItems(data.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(formData.get("email") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
        name: String(formData.get("name") ?? "").trim() || undefined,
      }),
    });

    setPending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "No se pudo crear la cuenta.");
      return;
    }

    setSuccess("Cuenta creada. El usuario debe cambiar la contraseña al ingresar.");
    e.currentTarget.reset();
    await load();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <header className="pb-8">
          <h1 className="font-display text-3xl text-stone-900">Cuentas</h1>
          <p className="mt-1 text-sm text-stone-400">
            Crear cuentas para que nuevos usuarios accedan a la plataforma.
          </p>
        </header>

        <section className="mb-10 rounded-md border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-stone-400">
            Nueva cuenta
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {error && (
              <div role="alert" className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div role="status" className="md:col-span-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                {success}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">
                Correo
              </label>
              <Input id="email" name="email" type="email" required placeholder="usuario@ejemplo.com" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">
                Contraseña inicial
              </label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-stone-700">
                Nombre de cuenta (opcional)
              </label>
              <Input id="name" name="name" type="text" maxLength={100} placeholder="Acme Corp" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Creando…" : "Crear cuenta"}
              </Button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-stone-400">
            Cuentas existentes
          </h2>
          {loading ? (
            <p className="text-sm text-stone-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-stone-500">No hay cuentas todavía.</p>
          ) : (
            <div className="overflow-hidden rounded-md border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-100 bg-stone-50/80 text-xs uppercase tracking-widest text-stone-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Correo</th>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Creada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-stone-900">{row.email ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{row.name ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-500">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
