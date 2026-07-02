"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TagPill } from "@/components/ui/TagPill";
import { Button } from "@/components/ui/Button";
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

type Tab = "registros" | "detalles";

export function TagProfile({ tag: initial }: { tag: TagProfileData }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("registros");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState<TagColorKey>(
    (initial.color as TagColorKey) || DEFAULT_TAG_COLOR,
  );
  const [description, setDescription] = useState(initial.description ?? "");
  const [display, setDisplay] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function deleteTag() {
    const n = display.count;
    const msg =
      `¿Eliminar el tag “${display.name}”?\n\n` +
      "Se borrarán sus contactos, fechas y documentos. " +
      (n > 0
        ? `Los ${n} registro${n === 1 ? "" : "s"} asociado${n === 1 ? "" : "s"} no se eliminan; solo se quita este tag.`
        : "Los registros no se eliminan.");
    if (!confirm(msg)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tags/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(typeof data.error === "string" ? data.error : "No se pudo eliminar el tag.");
        return;
      }
      router.push("/tags");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/tags/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color,
          description: description.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "No se pudo guardar.");
        return;
      }
      const updated = {
        ...display,
        name: data.name as string,
        color: data.color as string | null,
        description: data.description as string | null,
      };
      setDisplay(updated);
      setEditing(false);
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
      ? "0 registros"
      : `${display.count} registro${display.count === 1 ? "" : "s"}${
          display.lastRecordAt ? ` · último ${relTimeAgo(display.lastRecordAt)}` : ""
        }`;

  return (
    <>
      <nav className="mb-4 text-sm text-text-3">
        <Link href="/tags" className="hover:text-text-2">
          Tags
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-2">{display.name}</span>
      </nav>

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <TagPill name={display.name} color={display.color} size="md" />
          <p className="mt-2 text-sm text-text-2">{meta}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => setEditing((e) => !e)}>
            {editing ? "Cancelar" : "Editar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-[#B42318] hover:bg-surface-2 hover:text-[#B42318]"
            disabled={deleting}
            onClick={() => void deleteTag()}
          >
            {deleting ? "Eliminando…" : "Eliminar tag"}
          </Button>
        </div>
      </header>

      {editing ? (
        <form
          onSubmit={saveEdit}
          className="mb-6 rounded-card border border-border bg-surface p-4"
        >
          <div className="grid gap-3 min-[760px]:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">Nombre</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
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
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium text-text">Descripción</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción corta…"
            />
          </div>
          {error && <p className="mt-2 text-sm text-[#B42318]">{error}</p>}
          <div className="mt-4">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      ) : (
        <TagDescriptionEditor
          key={`${initial.id}:${display.description ?? ""}`}
          tagId={initial.id}
          initial={display.description ?? ""}
          onSaved={(description) => setDisplay((d) => ({ ...d, description }))}
        />
      )}

      <div className="mb-6 flex gap-6 border-b border-border">
        {(["registros", "detalles"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2 text-sm font-medium capitalize ${
              tab === t
                ? "border-text text-text"
                : "border-transparent text-text-2 hover:text-text"
            }`}
          >
            {t === "registros" ? "Registros" : "Detalles"}
          </button>
        ))}
      </div>

      {tab === "registros" ? (
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
    </>
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
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const next = text.trim();
    const prev = initial.trim();
    if (next === prev) return;
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
        setError(typeof data.error === "string" ? data.error : "No se pudo guardar.");
        return;
      }
      onSaved((data.description as string | null) ?? null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6">
      <label className="mb-1.5 block text-sm font-medium text-text">
        Descripción <span className="font-normal text-text-3">(opcional)</span>
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => void save()}
        rows={2}
        placeholder="De qué trata este tag…"
        className="w-full resize-y rounded-btn border border-border-strong bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-text-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      {(saving || error) && (
        <p className={`mt-1 text-xs ${error ? "text-[#B42318]" : "text-text-3"}`}>
          {error || "Guardando…"}
        </p>
      )}
    </div>
  );
}
