"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagPill } from "@/components/ui/TagPill";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  TAG_COLORS,
  TAG_COLOR_KEYS,
  DEFAULT_TAG_COLOR,
  type TagColorKey,
} from "@/lib/tag-colors";

export type TagRow = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  count: number;
};

function countLabel(n: number): string {
  return n === 1 ? "1 registro" : `${n} registros`;
}

export function TagsView({ tags }: { tags: TagRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColorKey>(DEFAULT_TAG_COLOR);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function createTag(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          color,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "No se pudo crear el tag.");
        return;
      }
      setCreating(false);
      setName("");
      setDescription("");
      setColor(DEFAULT_TAG_COLOR);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">Tags</h1>
          <p className="mt-1 text-sm text-text-2">
            Cada tag tiene su perfil: contactos, fechas y documentos.
          </p>
        </div>
        {!creating && (
          <Button variant="accent" type="button" onClick={() => setCreating(true)}>
            ＋ Nuevo tag
          </Button>
        )}
      </header>

      {creating && (
        <form
          onSubmit={createTag}
          className="mb-6 rounded-card border border-border bg-surface p-4"
        >
          <div className="mb-3 text-sm font-medium text-text">Nuevo tag</div>
          <div className="grid gap-3 min-[760px]:grid-cols-2">
            <div>
              <label htmlFor="tag-name" className="mb-1.5 block text-sm font-medium text-text">
                Nombre
              </label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. trabajo"
                required
                autoFocus
              />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-text">Color</span>
              <div className="flex h-9 items-center gap-1.5">
                {TAG_COLOR_KEYS.map((k) => {
                  const c = TAG_COLORS[k];
                  const selected = k === color;
                  return (
                    <button
                      key={k}
                      type="button"
                      title={k}
                      onClick={() => setColor(k)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${selected ? "scale-110" : ""}`}
                      style={{
                        background: c.dot,
                        borderColor: selected ? "#292524" : c.border,
                      }}
                      aria-label={`Color ${k}`}
                    />
                  );
                })}
                <TagPill name={name.trim() || "vista previa"} color={color} />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label
              htmlFor="tag-desc"
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Descripción <span className="font-normal text-text-3">(opcional)</span>
            </label>
            <Input
              id="tag-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="De qué trata este tag…"
            />
          </div>
          {error && (
            <p className="mt-2 text-sm" style={{ color: "#B42318" }}>
              {error}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button type="submit" variant="primary" disabled={pending || !name.trim()}>
              {pending ? "Creando…" : "Crear tag"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setError("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {tags.length === 0 && !creating && (
        <EmptyState
          title="No hay tags todavía."
          help="Crea el primero con 'Nuevo tag'."
        />
      )}

      <div className="grid grid-cols-1 gap-3 min-[760px]:grid-cols-2">
        {tags.map((t) => (
          <Link
            key={t.id}
            href={`/tags/${encodeURIComponent(t.name)}`}
            className="rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-center justify-between gap-2">
              <TagPill name={t.name} color={t.color} size="md" />
              <span className="shrink-0 text-xs tabular-nums text-text-3">
                {countLabel(t.count)}
              </span>
            </div>
            {t.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-text-2">{t.description}</p>
            ) : (
              <p className="mt-2 text-sm text-text-3">Sin descripción</p>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
