"use client";

import { useState } from "react";

/* Auth — signup y login en un componente (prop mode).
   Centrado sobre stone-50, tarjeta blanca de bordes rectos.
   NextAuth credentials: onSubmit conecta con signIn()/tu endpoint de registro. */

export function SignupScreen({
  mode = "signup",
  error,
  loading = false,
  onSubmit,
  onSwitchMode,
}: {
  mode?: "signup" | "login";
  error?: string;
  loading?: boolean;
  onSubmit?: (data: { name?: string; email: string; password: string }) => void;
  onSwitchMode?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignup = mode === "signup";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-10">
      {/* Marca */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-stone-900 font-display text-lg text-white">
          T
        </div>
        <span className="font-display text-2xl text-stone-900">paperTrail</span>
      </div>

      <div className="w-full max-w-sm rounded-md border border-stone-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:p-8">
        <h1 className="font-display text-xl text-stone-900">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          {isSignup
            ? "A journal for everything you do."
            : "Log in to continue where you left off."}
        </p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(isSignup ? { name, email, password } : { email, password });
          }}
        >
          {isSignup && (
            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)}
                autoComplete="name" required placeholder="Your name" className={inputCls} />
            </Field>
          )}
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" required placeholder="you@example.com" className={inputCls} />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required minLength={8}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              className={inputCls} />
          </Field>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="mt-1 rounded-md bg-stone-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-60">
            {loading ? "One moment…" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-sm text-stone-400">
        {isSignup ? "Already have an account?" : "New to Trail?"}{" "}
        <button onClick={onSwitchMode} className="font-medium text-stone-700 underline-offset-2 hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-300 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}
