"use client";

import { ExternalLink, LogOut, Check } from "lucide-react";
import { Sidebar } from "../Sidebar";
import { MobileNav } from "../ui/MobileNav";

/* Cuenta y plan.
   - Account: nombre, email
   - Preferences: idioma (English default, Español) — decisión previa de i18n
   - Plan: plan actual; pago/upgrade NO se maneja aquí — redirige a Stripe
     (Checkout para upgrade, Customer Portal para manage billing)
   - Sign out */

export function ProfileScreen({
  userName = "diego",
  email = "diego@develoft.com",
  language = "en",
  plan = "free",
  planRenewsOn,
  pendingCount = 10,
  onNameChange,
  onLanguageChange,
  onUpgrade,        // → redirect a Stripe Checkout
  onManageBilling,  // → redirect a Stripe Customer Portal
  onLogout,
}: {
  userName?: string;
  email?: string;
  language?: "en" | "es";
  plan?: "free" | "pro";
  planRenewsOn?: string; // "Aug 6, 2026"
  pendingCount?: number;
  onNameChange?: (v: string) => void;
  onLanguageChange?: (v: "en" | "es") => void;
  onUpgrade?: () => void;
  onManageBilling?: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar active="home" pendingCount={pendingCount} userName={userName} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-8 md:py-10">
          <header className="pb-8">
            <h1 className="font-display text-3xl text-stone-900">Account</h1>
            <p className="mt-1 text-sm text-stone-400">Your profile, preferences and plan.</p>
          </header>

          {/* Profile */}
          <Section title="Profile">
            <Row label="Name">
              <input
                defaultValue={userName}
                onBlur={(e) => onNameChange?.(e.target.value)}
                className="w-full max-w-xs rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </Row>
            <Row label="Email">
              <span className="text-sm text-stone-500">{email}</span>
            </Row>
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            <Row label="Language">
              <select
                value={language}
                onChange={(e) => onLanguageChange?.(e.target.value as "en" | "es")}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </Row>
          </Section>

          {/* Plan */}
          <Section title="Plan">
            <div className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg text-stone-900">
                      {plan === "pro" ? "Pro" : "Free"}
                    </span>
                    {plan === "pro" && (
                      <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                        Active
                      </span>
                    )}
                  </div>
                  {plan === "pro" ? (
                    <p className="mt-1 text-sm text-stone-400">
                      {planRenewsOn ? `Renews on ${planRenewsOn}` : "Active subscription"}
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {["Unlimited entries and tags", "Document uploads", "Priority support"].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-stone-500">
                          <Check className="h-3.5 w-3.5 text-stone-300" />
                          {f}
                          <span className="text-xs text-stone-300">— Pro</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {plan === "pro" ? (
                  <button onClick={onManageBilling}
                    className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:text-stone-900">
                    Manage billing
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                  </button>
                ) : (
                  <button onClick={onUpgrade}
                    className="flex items-center gap-1.5 rounded-md bg-stone-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800">
                    Upgrade to Pro
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs text-stone-400">
                Payments are handled securely by Stripe. You'll be redirected to complete checkout.
              </p>
            </div>
          </Section>

          {/* Session */}
          <Section title="Session">
            <button onClick={onLogout}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-stone-600 transition hover:bg-stone-50 hover:text-stone-900">
              <LogOut className="h-4 w-4 text-stone-400" />
              Sign out
            </button>
          </Section>
        </div>
      </main>

      <MobileNav active="home" pendingCount={pendingCount} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-stone-400">{title}</h2>
      <div className="divide-y divide-stone-100 rounded-md border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {children}
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <span className="text-sm text-stone-500">{label}</span>
      {children}
    </div>
  );
}
