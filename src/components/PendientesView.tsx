"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, GripVertical } from "lucide-react";
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

function flattenGrouped(map: Record<TodoBucket, TodoItem[]>): TodoItem[] {
  return TODO_BUCKET_ORDER.flatMap((b) => map[b]);
}

function makeDragClone(row: HTMLElement): HTMLElement {
  const rect = row.getBoundingClientRect();
  const clone = row.cloneNode(true) as HTMLElement;
  clone.dataset.todoDragClone = "1";
  clone.style.cssText = [
    `width:${rect.width}px`,
    "position:fixed",
    "left:0",
    "top:0",
    "margin:0",
    "pointer-events:none",
    "z-index:9999",
    "border-radius:8px",
    "background:#fff",
    "box-shadow:0 12px 28px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)",
    "opacity:0.96",
    "will-change:transform",
  ].join(";");
  document.body.appendChild(clone);
  return clone;
}

export function PendientesView() {
  const [status, setStatus] = useState<Status>("pending");
  const [tagId, setTagId] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [counts, setCounts] = useState<Counts>({ open: 0, done: 0, all: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [gapH, setGapH] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);
  const dragClone = useRef<HTMLElement | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dragBucketRef = useRef<TodoBucket | null>(null);
  const grabOffset = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const pendingY = useRef<number | null>(null);
  const rafRef = useRef(0);
  const lastInsertRef = useRef<number | null>(null);
  const startMidsRef = useRef<number[]>([]);
  const startScrollRef = useRef(0);
  const unbindDrag = useRef<(() => void) | null>(null);
  const todosRef = useRef(todos);
  const groupedRef = useRef<Record<TodoBucket, TodoItem[]>>({
    overdue: [],
    today: [],
    week: [],
    later: [],
    none: [],
  });
  todosRef.current = todos;

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
    return map;
  }, [todos]);
  groupedRef.current = grouped;

  const total = counts.open + counts.done;
  const tagFilterLabel =
    tags.find((t) => t.id === tagId)?.name ?? "All tags";

  function cleanupDragChrome() {
    unbindDrag.current?.();
    unbindDrag.current = null;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    pendingY.current = null;
    lastInsertRef.current = null;
    startMidsRef.current = [];
    dragClone.current?.remove();
    dragClone.current = null;
    document.querySelectorAll("[data-todo-drag-clone]").forEach((el) => el.remove());
    dragIdRef.current = null;
    dragBucketRef.current = null;
    setDragId(null);
    setGapH(0);
  }

  async function persistOrder(next: TodoItem[]) {
    const res = await fetch("/api/todos/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((t) => t.id) }),
    });
    if (!res.ok) {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (tagId) params.set("tagId", tagId);
      const r = await fetch(`/api/todos?${params}`);
      if (r.ok) {
        const d = await r.json();
        setTodos(d?.items ?? []);
      }
    }
  }

  // insertAt from mids cached at drag-start (scroll-adjusted). Live DOM midpoints
  // would oscillate once the gap spacer has height.
  function reorderByY(clientY: number) {
    const id = dragIdRef.current;
    const bucket = dragBucketRef.current;
    if (!id || !bucket) return;

    const scrollDelta =
      (listRef.current?.scrollTop ?? 0) - startScrollRef.current;
    let insertAt = startMidsRef.current.length;
    for (let i = 0; i < startMidsRef.current.length; i++) {
      if (clientY < startMidsRef.current[i] - scrollDelta) {
        insertAt = i;
        break;
      }
    }
    if (lastInsertRef.current === insertAt) return;
    lastInsertRef.current = insertAt;

    const items = groupedRef.current[bucket];
    const from = items.findIndex((t) => t.id === id);
    if (from < 0) return;
    const dragged = items[from];
    const others = items.filter((t) => t.id !== id);
    const next = [...others];
    next.splice(insertAt, 0, dragged);
    if (next.every((t, i) => t.id === items[i].id)) return;

    setTodos(
      flattenGrouped({
        ...groupedRef.current,
        [bucket]: next,
      }),
    );
  }

  function scheduleReorder(clientY: number) {
    pendingY.current = clientY;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const y = pendingY.current;
      if (y != null) reorderByY(y);
    });
  }

  function autoScroll(clientY: number) {
    const scroller = listRef.current;
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    const edge = 64;
    if (clientY < rect.top + edge) scroller.scrollBy(0, -14);
    else if (clientY > rect.bottom - edge) scroller.scrollBy(0, 14);
  }

  function finishDrag() {
    if (!dragIdRef.current) return;
    const ordered = todosRef.current;
    cleanupDragChrome();
    void persistOrder(ordered);
  }

  function onGripPointerDown(
    e: ReactPointerEvent<HTMLSpanElement>,
    id: string,
    bucket: TodoBucket,
  ) {
    if (e.button !== 0) return;
    const row = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-todo-id]");
    if (!row) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = row.getBoundingClientRect();
    grabOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    didDragRef.current = false;
    dragIdRef.current = id;
    dragBucketRef.current = bucket;

    const items = groupedRef.current[bucket];
    const from = items.findIndex((t) => t.id === id);
    const others = items.filter((t) => t.id !== id);
    startScrollRef.current = listRef.current?.scrollTop ?? 0;
    startMidsRef.current = others.map((t) => {
      const el = document.querySelector<HTMLElement>(
        `[data-todo-id="${CSS.escape(t.id)}"]`,
      );
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    lastInsertRef.current = from;
    setGapH(rect.height);
    setDragId(id);

    const clone = makeDragClone(row);
    clone.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1.02) rotate(1deg)`;
    dragClone.current = clone;

    const pointerId = e.pointerId;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      if (!dragIdRef.current || !dragClone.current) return;
      dragClone.current.style.transform = `translate3d(${ev.clientX - grabOffset.current.x}px, ${ev.clientY - grabOffset.current.y}px, 0) scale(1.02) rotate(1deg)`;
      if (ev.movementX || ev.movementY) didDragRef.current = true;
      autoScroll(ev.clientY);
      scheduleReorder(ev.clientY);
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      unbindDrag.current?.();
      unbindDrag.current = null;
      finishDrag();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    unbindDrag.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }

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
    <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
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
                    const isDragging = dragId === t.id;

                    if (isDragging) {
                      return (
                        <div
                          key={t.id}
                          aria-hidden
                          style={{ height: gapH }}
                          className="rounded-sm bg-stone-800/25 ring-1 ring-inset ring-stone-800/30 transition-[height] duration-150 ease-out"
                        />
                      );
                    }

                    return (
                      <div
                        key={t.id}
                        data-todo-id={t.id}
                        data-todo-bucket={g}
                        className="transition-transform duration-150 ease-out"
                      >
                        <Link
                          href={`/registros/${t.record.id}/editar`}
                          aria-label={`Open ${t.record.title || "Untitled"}: ${t.text || "to-do"}`}
                          onClick={(e) => {
                            if (didDragRef.current || dragIdRef.current) {
                              e.preventDefault();
                              didDragRef.current = false;
                            }
                          }}
                          className="group flex gap-1.5 px-1.5 py-3 transition-colors duration-150 hover:bg-stone-50 md:items-center md:gap-3 md:px-3"
                        >
                          <span
                            onPointerDown={(e) => onGripPointerDown(e, t.id, g)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="-my-1.5 -ml-1 flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center text-stone-300 hover:text-stone-500 active:cursor-grabbing md:h-auto md:w-auto md:justify-start md:px-0 md:py-0"
                            aria-label="Drag to reorder"
                            role="button"
                            tabIndex={0}
                          >
                            <GripVertical className="h-4 w-4" />
                          </span>
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
                      </div>
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
