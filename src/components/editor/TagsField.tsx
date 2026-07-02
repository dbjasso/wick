"use client";

import { useEffect, useRef, useState } from "react";
import { TagPill } from "@/components/ui/TagPill";
import {
  TAG_COLORS,
  TAG_COLOR_KEYS,
  DEFAULT_TAG_COLOR,
  type TagColorKey,
} from "@/lib/tag-colors";

export type TagValue = { name: string; color?: string | null };

type ApiTag = { name: string; color?: string | null; description?: string | null };

export function TagsField({
  value,
  onChange,
  onAfterChange,
}: {
  value: TagValue[];
  onChange: (tags: TagValue[]) => void;
  onAfterChange?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newColor, setNewColor] = useState<TagColorKey>(DEFAULT_TAG_COLOR);
  const [newDescription, setNewDescription] = useState("");
  const [allTags, setAllTags] = useState<ApiTag[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAllTags(d?.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = query.trim().toLowerCase();
  const taken = new Set(value.map((t) => t.name.toLowerCase()));
  const suggestions = allTags
    .filter((t) => t.name.toLowerCase().includes(q) && !taken.has(t.name.toLowerCase()))
    .slice(0, 6);
  const exactMatch = allTags.find((t) => t.name.toLowerCase() === q);
  const canCreate = q.length > 0 && !exactMatch && !taken.has(q);

  function addLocal(name: string, color?: string | null) {
    const n = name.trim();
    if (!n || value.some((t) => t.name.toLowerCase() === n.toLowerCase())) return false;
    onChange([...value, { name: n, color: color ?? undefined }]);
    setQuery("");
    setNewDescription("");
    setError("");
    setOpen(false);
    onAfterChange?.();
    return true;
  }

  async function createNew() {
    const trimmed = query.trim();
    if (!trimmed || !canCreate) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          color: newColor,
          description: newDescription.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as ApiTag & { error?: string };
      if (res.status === 409) {
        const existing = allTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
        addLocal(existing?.name ?? trimmed, existing?.color ?? newColor);
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "No se pudo crear el tag.");
        return;
      }
      setAllTags((prev) =>
        [...prev.filter((t) => t.name !== data.name), data].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      addLocal(data.name, data.color);
    } finally {
      setPending(false);
    }
  }

  function pickExisting(tag: ApiTag) {
    addLocal(tag.name, tag.color);
  }

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((t) => (
          <TagPill key={t.name} name={t.name} color={t.color} onRemove={() => {
            onChange(value.filter((x) => x.name !== t.name));
            onAfterChange?.();
          }} />
        ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-pill border border-dashed border-border-strong px-2.5 py-0.5 text-xs font-medium text-text-2 hover:bg-surface-2 hover:text-text"
        >
          ＋ Tag
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-card border border-border bg-surface p-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (suggestions[0] && !canCreate) pickExisting(suggestions[0]);
                else if (canCreate) void createNew();
                else if (exactMatch) pickExisting(exactMatch);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Buscar o crear tag…"
            className="h-8 w-full rounded-btn border border-border-strong bg-surface px-2.5 text-sm text-text outline-none placeholder:text-text-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
          />

          {suggestions.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {suggestions.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() => pickExisting(s)}
                    className="flex w-full items-center rounded-btn px-2 py-1.5 text-left hover:bg-surface-2"
                  >
                    <TagPill name={s.name} color={s.color} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {canCreate && (
            <div className="mt-2 rounded-btn bg-surface-2 px-2 py-2">
              <div className="mb-1.5 text-xs text-text-2">
                Crear <span className="font-medium text-text">“{query.trim()}”</span>
              </div>
              <div className="mb-2 flex items-center gap-1.5">
                {TAG_COLOR_KEYS.map((k) => {
                  const c = TAG_COLORS[k];
                  const selected = k === newColor;
                  return (
                    <button
                      key={k}
                      type="button"
                      title={k}
                      onClick={() => setNewColor(k)}
                      className={`h-5 w-5 rounded-full border-2 transition-transform ${selected ? "scale-110" : ""}`}
                      style={{
                        background: c.dot,
                        borderColor: selected ? "#292524" : c.border,
                      }}
                      aria-label={`Color ${k}`}
                    />
                  );
                })}
              </div>
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                className="mb-2 h-8 w-full rounded-btn border border-border-strong bg-surface px-2.5 text-sm text-text outline-none placeholder:text-text-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => void createNew()}
                className="rounded-btn bg-text px-2.5 py-1 text-xs font-medium text-surface hover:bg-text/90 disabled:opacity-60"
              >
                {pending ? "Creando…" : "Crear tag"}
              </button>
            </div>
          )}

          {error && <p className="mt-1.5 px-2 text-sm text-[#B42318]">{error}</p>}

          {!canCreate && suggestions.length === 0 && !error && (
            <p className="mt-1.5 px-2 py-1.5 text-sm text-text-3">
              {q ? "Sin coincidencias." : "Escribe para buscar o crear."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
