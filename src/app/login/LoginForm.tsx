"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      totp: String(formData.get("totp") ?? "").trim(),
      redirect: false,
    });

    setPending(false);
    if (result?.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    setError("Correo o contraseña incorrectos. Intenta de nuevo.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-btn bg-text text-base font-bold text-surface">
            T
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-text">
            Bienvenido de vuelta
          </h1>
          <p className="mt-1 text-sm text-text-2">
            Inicia sesión para continuar.
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
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Correo
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Contraseña
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-btn px-2 py-1 text-xs font-medium text-text-2 hover:bg-surface-2 hover:text-text"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {twoFactorEnabled && (
            <div>
              <label
                htmlFor="totp"
                className="mb-1.5 block text-sm font-medium text-text"
              >
                Código 2FA
              </label>
              <Input
                id="totp"
                name="totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="000000"
                className="tracking-widest"
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={pending}
            className="w-full"
          >
            {pending ? "Ingresando…" : "Iniciar sesión"}
          </Button>
        </form>
      </div>
    </main>
  );
}
