"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { TagPill } from "@/components/ui/TagPill";
import { DueDateButton } from "@/components/ui/DueDateButton";
import {
  shortDate,
  todoBucket,
  TODO_BUCKET_ORDER,
  TODO_BUCKET_LABELS,
  type TodoBucket,
} from "@/lib/date-labels";

type Tag = { id: string; name: string; color: string | null };
type TodoItem = {
  id: string;
  text: string;
  checked: boolean;
  dueDate: string | null;
  record: { id: string; date: string; title: string; tags: Tag[] };
};

type Status = "pending" | "done" | "all";
type Counts = { open: number; done: number; all: number };

export function PendientesView() {
  const [status, setStatus] = useState<Status>("pending");
  const [tagId, setTagId] = useState("");
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
    const map: Record<TodoBucket, TodoItem[]> = {
      overdue: [],
      today: [],
      week: [],
      later: [],
      none: [],
    };
    for (const t of todos) map[todoBucket(t.dueDate)].push(t);
    for (const bucket of TODO_BUCKET_ORDER) {
      map[bucket].sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.record.date.localeCompare(a.record.date);
      });
    }
    return map;
  }, [todos]);

  const total = counts.open + counts.done;
  const tagFilterLabel =
    tags.find((t) => t.id === tagId)?.name ?? "All tags";

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

  async function setDueDate(id: string, dueDate: string | null) {
    const prev = todos.find((t) => t.id === id)?.dueDate ?? null;
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, dueDate } : t)));
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate }),
    });
    if (!res.ok) {
      setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, dueDate: prev } : t)));
    }
  }

  function primaryTag(t: TodoItem): Tag | undefined {
    if (tagId) return t.record.tags.find((x) => x.id === tagId) ?? t.record.tags[0];
    return t.record.tags[0];
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <header className="pb-6">
          <h1 className="font-display text-3xl text-stone-900">To-dos</h1>
          <p className="mt-1 text-sm text-stone-400">
            From all your entries, in one place. Check here and the original updates too.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 pb-6">
          <div className="flex rounded-md border border-stone-200 bg-white p-0.5 shadow-sm">
            {(
              [
                ["pending", "open", `Open · ${counts.open}`],
                ["done", "done", `Done · ${counts.done}`],
                ["all", "all", `All · ${total}`],
              ] as const
            ).map(([value, , label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded px-3 py-1.5 text-sm transition ${
                  status === value
                    ? "bg-stone-900 font-medium text-white"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tags.length > 0 && (
            <label className="relative flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 shadow-sm transition hover:border-stone-300">
              <span className="pointer-events-none max-w-[120px] truncate">
                {tagFilterLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400" />
              <select
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Filter by tag"
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {todos.length === 0 ? (
          <div className="rounded-md border border-dashed border-stone-300 px-6 py-12 text-center">
            <p className="text-sm text-stone-500">No to-dos match these filters.</p>
            <p className="mt-1 text-xs text-stone-400">Try another status or tag.</p>
          </div>
        ) : (
          TODO_BUCKET_ORDER.map((g) => {
            const items = grouped[g];
            if (items.length === 0) return null;
            return (
              <section key={g} className="mb-7">
                <h2
                  className={`mb-2 text-xs font-medium uppercase tracking-widest ${
                    g === "overdue" ? "text-red-500" : "text-stone-400"
                  }`}
                >
                  {TODO_BUCKET_LABELS[g]}
                </h2>
                <div className="divide-y divide-stone-100 rounded-md border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  {items.map((t) => {
                    const tag = primaryTag(t);
                    return (
                      <Link
                        key={t.id}
                        href={`/registros/${t.record.id}/editar`}
                        aria-label={`Open ${t.record.title || "Untitled"}: ${t.text || "to-do"}`}
                        className="group flex gap-3 px-3 py-3 transition hover:bg-stone-50 md:items-center md:px-4"
                      >
                        <input
                          type="checkbox"
                          checked={t.checked}
                          onClick={(e) => e.preventDefault()}
                          onChange={(e) => toggle(t.id, e.target.checked)}
                          aria-label={t.text || "To-do item"}
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-sm border-[1.5px] border-stone-300 transition checked:border-stone-900 checked:bg-stone-900 hover:border-stone-400 md:mt-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm ${
                              t.checked
                                ? "text-stone-400 line-through"
                                : "text-stone-800"
                            }`}
                          >
                            {t.text || (
                              <span className="text-stone-400">(empty item)</span>
                            )}
                          </span>
                          {t.record.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
                              {t.record.tags.map((tg) => (
                                <TagPill
                                  key={tg.id}
                                  name={tg.name}
                                  color={tg.color}
                                  size="sm"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-400 opacity-0 transition group-hover:opacity-100 md:flex">
                          {t.record.title || "Untitled"} · {shortDate(t.record.date)}
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                        <span
                          className={`shrink-0 transition ${
                            t.dueDate
                              ? "opacity-100"
                              : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <DueDateButton
                            value={t.dueDate}
                            onChange={(v) => void setDueDate(t.id, v)}
                          />
                        </span>
                        {tag && (
                          <span className="hidden shrink-0 md:inline-flex">
                            <TagPill name={tag.name} color={tag.color} size="sm" />
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
