"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { TagPill } from "@/components/ui/TagPill";
import {
  TAG_COLORS,
  TAG_COLOR_KEYS,
  DEFAULT_TAG_COLOR,
  tagColor,
  type TagColorKey,
} from "@/lib/tag-colors";

export type TagRow = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  count: number;
};

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
        setError(typeof data.error === "string" ? data.error : "Could not create tag.");
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
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <header className="flex items-end justify-between pb-6 md:pb-8">
          <div>
            <h1 className="font-display text-3xl text-stone-900">Tags</h1>
            <p className="mt-1 text-sm text-stone-400">
              Each tag has a profile: contacts, dates and documents.
            </p>
          </div>
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:text-stone-900"
            >
              <Plus className="h-4 w-4" />
              New tag
            </button>
          )}
        </header>

        {creating && (
          <form
            onSubmit={createTag}
            className="mb-6 rounded-md border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <div className="mb-3 text-sm font-medium text-stone-900">New tag</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="tag-name" className="mb-1.5 block text-sm font-medium text-stone-700">
                  Name
                </label>
                <Input
                  id="tag-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. work"
                  required
                  autoFocus
                  className="border-stone-200"
                />
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-stone-700">Color</span>
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
                  <TagPill name={name.trim() || "preview"} color={color} />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <label htmlFor="tag-desc" className="mb-1.5 block text-sm font-medium text-stone-700">
                Description <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <Input
                id="tag-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this tag about…"
                className="border-stone-200"
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={pending || !name.trim()}
                className="rounded-md bg-stone-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
              >
                {pending ? "Creating…" : "Create tag"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setError("");
                }}
                className="rounded-md px-3.5 py-2 text-sm text-stone-600 transition hover:bg-stone-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {tags.length === 0 && !creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full flex-col items-center gap-2 rounded-md border border-stone-200/80 bg-white px-8 py-12 text-center transition hover:border-stone-300"
          >
            <p className="font-display text-lg text-stone-800">Organize with tags</p>
            <p className="text-sm text-stone-400">
              Create your first one to group entries by project or topic.
            </p>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {tags.map((t) => {
              const dot = tagColor(t.name, t.color).dot;
              return (
                <Link
                  key={t.id}
                  href={`/tags/${encodeURIComponent(t.name)}`}
                  className="group flex items-center gap-3.5 rounded-md border border-stone-200/80 bg-white px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: dot }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-stone-900">{t.name}</span>
                    <p className="truncate text-sm text-stone-400">
                      {t.description || "Add a description…"}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-stone-400">
                    {t.count} {t.count === 1 ? "entry" : "entries"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-500" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
