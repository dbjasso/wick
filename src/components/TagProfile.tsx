"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { TagPill } from "@/components/ui/TagPill";
import { Input } from "@/components/ui/Input";
import {
  TAG_COLORS,
  TAG_COLOR_KEYS,
  DEFAULT_TAG_COLOR,
  type TagColorKey,
} from "@/lib/tag-colors";
import { relTimeAgo } from "@/lib/date-labels";
import { TagRecordsFeed, type FeedRecord } from "./tag-profile/TagRecordsFeed";
import { TagDetailsTab } from "./tag-profile/TagDetailsTab";

type Contact = { id: string; name: string; email: string | null; phone: string | null };
type DateItem = { id: string; label: string; date: string };
type DocumentItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type TagProfileData = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  count: number;
  lastRecordAt: string | null;
  contacts: Contact[];
  dates: DateItem[];
  documents: DocumentItem[];
  initialRecords: FeedRecord[];
  initialCursor: string | null;
};

type Tab = "entries" | "details";

export function TagProfile({ tag: initial }: { tag: TagProfileData }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("entries");
  const [editingMeta, setEditingMeta] = useState(false);
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState<TagColorKey>(
    (initial.color as TagColorKey) || DEFAULT_TAG_COLOR,
  );
  const [display, setDisplay] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function deleteTag() {
    const n = display.count;
    const msg =
      `Delete tag “${display.name}”?\n\n` +
      "Contacts, dates and documents on this tag will be removed. " +
      (n > 0
        ? `${n} linked ${n === 1 ? "entry keeps" : "entries keep"} its content; only this tag is removed.`
        : "Entries are not deleted.");
    if (!confirm(msg)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tags/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(typeof data.error === "string" ? data.error : "Could not delete tag.");
        return;
      }
      router.push("/tags");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/tags/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      const updated = {
        ...display,
        name: data.name as string,
        color: data.color as string | null,
      };
      setDisplay(updated);
      setEditingMeta(false);
      if (data.name !== initial.name) {
        router.replace(`/tags/${encodeURIComponent(data.name as string)}`);
      } else {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  const meta =
    display.count === 0
      ? "0 entries"
      : `${display.count} ${display.count === 1 ? "entry" : "entries"}${
          display.lastRecordAt ? ` · last ${relTimeAgo(display.lastRecordAt)}` : ""
        }`;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <Link
          href="/tags"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-400 transition hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tags
        </Link>

        <header className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <TagPill name={display.name} color={display.color} size="md" />
              {!editingMeta && (
                <button
                  type="button"
                  onClick={() => setEditingMeta(true)}
                  className="rounded p-1 text-stone-300 transition hover:bg-stone-100 hover:text-stone-600"
                  aria-label="Edit name and color"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void deleteTag()}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting…" : "Delete tag"}
            </button>
          </div>
          <p className="mt-2 text-sm text-stone-400">{meta}</p>

          {editingMeta && (
            <form
              onSubmit={saveMeta}
              className="mt-3 rounded-md border border-stone-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border-stone-200"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-xs font-medium text-stone-600">Color</span>
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
                          className={`h-6 w-6 rounded-full border-2 ${selected ? "scale-110" : ""}`}
                          style={{
                            background: c.dot,
                            borderColor: selected ? "#292524" : c.border,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeta(false);
                    setName(display.name);
                    setColor((display.color as TagColorKey) || DEFAULT_TAG_COLOR);
                    setError("");
                  }}
                  className="rounded-md px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <TagDescriptionEditor
            key={`${initial.id}:${display.description ?? ""}`}
            tagId={initial.id}
            initial={display.description ?? ""}
            onSaved={(description) => setDisplay((d) => ({ ...d, description }))}
          />
        </header>

        <div className="mt-6 flex gap-5 border-b border-stone-200">
          {(["entries", "details"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-2.5 text-sm capitalize transition ${
                tab === t
                  ? "border-stone-900 font-medium text-stone-900"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "entries" ? (
          <TagRecordsFeed
            key={initial.id}
            tagId={initial.id}
            initialRecords={initial.initialRecords}
            initialCursor={initial.initialCursor}
          />
        ) : (
          <TagDetailsTab
            tagId={initial.id}
            contacts={display.contacts}
            dates={display.dates}
            documents={display.documents}
          />
        )}
      </div>
    </div>
  );
}

function TagDescriptionEditor({
  tagId,
  initial,
  onSaved,
}: {
  tagId: string;
  initial: string;
  onSaved: (description: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const next = text.trim();
    const prev = initial.trim();
    if (next === prev) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: next || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      onSaved((data.description as string | null) ?? null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-3">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => void save()}
          rows={2}
          placeholder="What is this tag about…"
          className="w-full resize-none rounded-md border border-stone-200 bg-white p-3 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
        {(saving || error) && (
          <p className={`mt-1 text-xs ${error ? "text-red-600" : "text-stone-400"}`}>
            {error || "Saving…"}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group mt-3 flex items-center gap-2 text-left text-sm text-stone-500 transition hover:text-stone-800"
    >
      {text.trim() || <span className="text-stone-300">Add a description…</span>}
      <Pencil className="h-3 w-3 text-stone-300 opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}
