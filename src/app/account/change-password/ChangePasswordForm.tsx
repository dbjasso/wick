"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ChangePasswordForm() {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: String(formData.get("newPassword") ?? ""),
        confirmPassword: String(formData.get("confirmPassword") ?? ""),
      }),
    });

    setPending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "No se pudo cambiar la contraseña.");
      return;
    }

    await update({ mustChangePassword: false });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-btn bg-text text-base font-bold text-surface">
            T
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-text">
            Cambia tu contraseña
          </h1>
          <p className="mt-1 text-sm text-text-2">
            Por seguridad, debes elegir una nueva contraseña antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-btn border px-3 py-2.5 text-sm"
              style={{
                background: "#FEF3F2",
                borderColor: "#FECDCA",
                color: "#B42318",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-text">
              Contraseña actual
            </label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-text">
              Nueva contraseña
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-text">
              Confirmar contraseña
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      </div>
    </main>
  );
}
