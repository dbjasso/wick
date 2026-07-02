"use client";

import { Button, buttonStyles } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { TagPill } from "@/components/ui/TagPill";
import { Sidebar } from "@/components/ui/Sidebar";
import { TAG_COLORS, TAG_COLOR_KEYS } from "@/lib/tag-colors";

// Página de muestra temporal para validar el sistema de diseño. Borrar tras
// la validación de la pantalla 1.

const SWATCHES: { token: string; var: string }[] = [
  { token: "bg", var: "var(--color-bg)" },
  { token: "surface", var: "var(--color-surface)" },
  { token: "surface-2", var: "var(--color-surface-2)" },
  { token: "border", var: "var(--color-border)" },
  { token: "border-strong", var: "var(--color-border-strong)" },
  { token: "text", var: "var(--color-text)" },
  { token: "text-2", var: "var(--color-text-2)" },
  { token: "text-3", var: "var(--color-text-3)" },
  { token: "accent", var: "var(--color-accent)" },
];

export default function UIPreview() {
  return (
    <div className="flex min-h-screen">
      <Sidebar email="admin@wick.local" pendingCount={3} />

      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-10">
          <header>
            <h1 className="text-2xl font-bold text-text">Sistema de diseño</h1>
            <p className="mt-1 text-sm text-text-2">
              Página de muestra — validar tokens y componentes compartidos.
            </p>
          </header>

          <Section title="Tokens de color">
            <div className="flex flex-wrap gap-3">
              {SWATCHES.map((s) => (
                <div key={s.token} className="rounded-card border border-border bg-surface p-2">
                  <div
                    className="h-12 w-24 rounded-btn border border-border"
                    style={{ background: s.var }}
                  />
                  <div className="mt-1.5 text-xs tabular-nums text-text-2">
                    {s.token}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Tags — paleta de 5">
            <div className="flex flex-wrap gap-2">
              {TAG_COLOR_KEYS.map((key, i) => (
                <TagPill
                  key={key}
                  name={`Tag ${i + 1}`}
                  color={key as keyof typeof TAG_COLORS}
                />
              ))}
              <TagPill name="Sin color (fallback hash)" />
              <TagPill name="Removible" onRemove={() => {}} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAG_COLOR_KEYS.map((key) => {
                const c = TAG_COLORS[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded border"
                      style={{ background: c.bg, borderColor: c.border }}
                    />
                    <span className="text-xs tabular-nums text-text-2">
                      {key}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Button">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primario</Button>
              <Button variant="accent">＋ Nuevo registro</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="icon" aria-label="icon">⋯</Button>
              <a href="#" className={buttonStyles("primary")}>
                Como link
              </a>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </Section>

          <Section title="Input">
            <div className="grid max-w-sm gap-3">
              <Input placeholder="Placeholder normal" />
              <Input placeholder="Inválido" defaultValue="mal" invalid />
              <Input type="password" defaultValue="secreto" />
            </div>
          </Section>

          <Section title="Checkbox">
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 text-sm text-text">
                <Checkbox /> Sin marcar
              </label>
              <label className="flex items-center gap-2.5 text-sm text-text">
                <Checkbox defaultChecked /> Marcado
              </label>
              <label className="flex items-center gap-2.5 text-sm text-text-3">
                <Checkbox disabled /> Disabled
              </label>
            </div>
          </Section>

          <Section title="EmptyState">
            <EmptyState
              title="Sin registros para esta fecha"
              help="Crea el primero con 'Nuevo registro'."
            />
          </Section>

          <Section title="Tipografía / horas">
            <div className="space-y-1 text-sm">
              <p className="text-text">Texto principal — 14px Inter</p>
              <p className="text-text-2">Texto secundario</p>
              <p className="text-text-3">Texto terciario · 14:30 · jue 2 jul</p>
              <p className="tabular-nums text-text-3">09:07 · 12:45 · 23:59</p>
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-3">
        {title}
      </h2>
      <div className="rounded-card border border-border bg-surface p-4">
        {children}
      </div>
    </section>
  );
}
