"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TagPill } from "@/components/ui/TagPill";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  recencyGroup,
  RECENCY_LABELS,
  shortDate,
  type RecencyGroup,
} from "@/lib/date-labels";

type Tag = { id: string; name: string; color: string | null };
type TodoItem = {
  id: string;
  text: string;
  checked: boolean;
  record: { id: string; date: string; title: string; tags: Tag[] };
};

type Status = "pending" | "done" | "all";

const STATUS_OPTIONS: { value: Status; label: string; countKey: keyof Counts }[] = [
  { value: "pending", label: "Abiertos", countKey: "open" },
  { value: "done", label: "Completados", countKey: "done" },
  { value: "all", label: "Todos", countKey: "all" },
];

type Counts = { open: number; done: number; all: number };

const GROUP_ORDER: RecencyGroup[] = ["hoy", "semana", "anteriores"];

export function PendientesView() {
  const [status, setStatus] = useState<Status>("pending");
  const [tagId, setTagId] = useState<string>("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [counts, setCounts] = useState<Counts>({ open: 0, done: 0, all: 0 });

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) =>
        setTags(
          (d?.items ?? []).map((t: Tag) => ({
            id: t.id,
            name: t.name,
            color: t.color,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (tagId) params.set("tagId", tagId);
    fetch(`/api/todos?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setTodos(d?.items ?? []);
        if (d?.counts) setCounts(d.counts);
      })
      .catch(() => setTodos([]));
  }, [status, tagId]);

  const grouped = useMemo(() => {
    const map: Record<RecencyGroup, TodoItem[]> = {
      hoy: [],
      semana: [],
      anteriores: [],
    };
    for (const t of todos) {
      map[recencyGroup(t.record.date)].push(t);
    }
    return map;
  }, [todos]);

  async function toggle(id: string, checked: boolean) {
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, checked } : t)));
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
    if (!res.ok) {
      setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, checked: !checked } : t)));
      return;
    }
    if (status !== "all") {
      setTodos((ts) => ts.filter((t) => t.id !== id));
      setCounts((c) => ({
        open: checked ? c.open - 1 : c.open + 1,
        done: checked ? c.done + 1 : c.done - 1,
        all: c.all,
      }));
    }
  }

  function primaryTag(t: TodoItem): Tag | undefined {
    if (tagId) return t.record.tags.find((x) => x.id === tagId) ?? t.record.tags[0];
    return t.record.tags[0];
  }

  return (
    <main className="flex-1 px-[34px] py-[26px]">
      <div className="mx-auto max-w-[860px]">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-text">Pendientes</h1>
          <p className="mt-1 text-sm text-text-2">
            To-do&apos;s de todos tus registros, en un solo lugar. Marca aquí y se
            actualiza en el registro original.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => {
              const n = counts[s.countKey];
              const active = status === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`rounded-pill border px-3 py-1 text-sm font-medium transition-colors ${
                    active
                      ? "border-text bg-surface-2 text-text"
                      : "border-border bg-surface text-text-2 hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  {s.label}
                  <span className="ml-1 tabular-nums text-text-3">({n})</span>
                </button>
              );
            })}
          </div>

          {tags.length > 0 && (
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="h-9 rounded-btn border border-border-strong bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label="Filtrar por tag"
            >
              <option value="">Todos los tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {todos.length === 0 ? (
          <EmptyState
            title="No hay ítems con estos filtros."
            help="Probá otro estado o tag."
          />
        ) : (
          <div className="space-y-6">
            {GROUP_ORDER.map((g) => {
              const items = grouped[g];
              if (items.length === 0) return null;
              return (
                <section key={g}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">
                    {RECENCY_LABELS[g]}
                  </h2>
                  <ul className="divide-y divide-border rounded-card border border-border bg-surface">
                    {items.map((t) => {
                      const tag = primaryTag(t);
                      return (
                        <li
                          key={t.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <Checkbox
                            checked={t.checked}
                            onChange={(e) => toggle(t.id, e.target.checked)}
                          />
                          <span
                            className={`min-w-0 flex-1 text-sm ${
                              t.checked ? "text-text-3 line-through" : "text-text"
                            }`}
                          >
                            {t.text || (
                              <span className="text-text-3">(ítem vacío)</span>
                            )}
                          </span>
                          {tag && (
                            <TagPill name={tag.name} color={tag.color} />
                          )}
                          <Link
                            href={`/registros/${t.record.id}/editar`}
                            className="shrink-0 text-xs tabular-nums text-text-2 hover:text-text"
                          >
                            {shortDate(t.record.date)} · {t.record.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
