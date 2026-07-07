"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { userNameFromEmail } from "@/lib/nav";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-stone-400">
        {title}
      </h2>
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

export function AccountView({ email }: { email?: string | null }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <header className="pb-8">
          <h1 className="font-display text-3xl text-stone-900">Account</h1>
          <p className="mt-1 text-sm text-stone-400">Your profile and session.</p>
        </header>

        <Section title="Profile">
          <Row label="Name">
            <span className="text-sm text-stone-900">{userNameFromEmail(email)}</span>
          </Row>
          <Row label="Email">
            <span className="text-sm text-stone-500">{email ?? "—"}</span>
          </Row>
        </Section>

        <Section title="Session">
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/login" })}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
          >
            <LogOut className="h-4 w-4 text-stone-400" />
            Sign out
          </button>
        </Section>
      </div>
    </div>
  );
}
