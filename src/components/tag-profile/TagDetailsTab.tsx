"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Contact = { id: string; name: string; email: string | null; phone: string | null };
type DateItem = { id: string; label: string; date: string };
type DocumentItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function ext(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toUpperCase() : "FILE";
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function TagDetailsTab({
  tagId,
  contacts: initialContacts,
  dates: initialDates,
  documents: initialDocs,
}: {
  tagId: string;
  contacts: Contact[];
  dates: DateItem[];
  documents: DocumentItem[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [dates, setDates] = useState(initialDates);
  const [docs, setDocs] = useState(initialDocs);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [dLabel, setDLabel] = useState("");
  const [dDate, setDDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function addContact() {
    if (!cName.trim()) return;
    const res = await fetch(`/api/tags/${tagId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cName.trim(),
        email: cEmail.trim() || undefined,
        phone: cPhone.trim() || undefined,
      }),
    });
    if (res.ok) {
      const created = (await res.json()) as Contact;
      setContacts((c) => [...c, created]);
      setCName("");
      setCEmail("");
      setCPhone("");
    }
  }

  async function removeContact(id: string) {
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) setContacts((c) => c.filter((x) => x.id !== id));
  }

  async function addDate() {
    if (!dLabel.trim() || !dDate) return;
    const res = await fetch(`/api/tags/${tagId}/dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: dLabel.trim(), date: new Date(dDate).toISOString() }),
    });
    if (res.ok) {
      const created = (await res.json()) as DateItem;
      setDates((d) => [...d, created]);
      setDLabel("");
      setDDate("");
    }
  }

  async function removeDate(id: string) {
    const res = await fetch(`/api/dates/${id}`, { method: "DELETE" });
    if (res.ok) setDates((d) => d.filter((x) => x.id !== id));
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/tags/${tagId}/documents`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "subida fallida");
      setDocs((d) => [...d, data as DocumentItem]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "subida fallida");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removeDoc(id: string, filename: string) {
    if (!confirm(`¿Eliminar el documento "${filename}"?`)) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) setDocs((d) => d.filter((x) => x.id !== id));
  }

  return (
    <div className="grid grid-cols-1 gap-4 min-[760px]:grid-cols-2">
      <Panel title="Contactos">
        <ul className="mb-3 space-y-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-2 rounded-btn border border-border px-3 py-2"
            >
              <div className="flex min-w-0 gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-xs font-semibold text-text">
                  {initials(c.name)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text">{c.name}</div>
                  <div className="text-xs text-text-2">
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeContact(c.id)}
                className="shrink-0 text-xs text-text-3 hover:text-text"
              >
                Eliminar
              </button>
            </li>
          ))}
          {contacts.length === 0 && (
            <li className="text-sm text-text-3">Sin contactos.</li>
          )}
        </ul>
        <div className="space-y-2">
          <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Nombre" />
          <div className="flex gap-2">
            <Input
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="Email"
              className="flex-1"
            />
            <Input
              value={cPhone}
              onChange={(e) => setCPhone(e.target.value)}
              placeholder="Teléfono"
              className="flex-1"
            />
          </div>
          <Button type="button" variant="primary" onClick={addContact} disabled={!cName.trim()}>
            Agregar contacto
          </Button>
        </div>
      </Panel>

      <Panel title="Documentos">
        <ul className="mb-3 space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-btn border border-border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-text-2">
                  {ext(d.filename)}
                </span>
                <div className="min-w-0">
                  <a
                    href={`/api/documents/${d.id}`}
                    className="block truncate text-sm font-medium text-text hover:underline"
                  >
                    {d.filename}
                  </a>
                  <div className="text-xs tabular-nums text-text-3">
                    {formatBytes(d.size)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeDoc(d.id, d.filename)}
                className="shrink-0 text-xs text-text-3 hover:text-text"
              >
                Eliminar
              </button>
            </li>
          ))}
          {docs.length === 0 && <li className="text-sm text-text-3">Sin documentos.</li>}
        </ul>
        <label className="inline-flex cursor-pointer">
          <span
            className={`inline-flex h-9 items-center rounded-btn bg-text px-3.5 text-sm font-medium text-surface hover:bg-text/90 ${uploading ? "opacity-60" : ""}`}
          >
            {uploading ? "Subiendo…" : "Subir archivo"}
          </span>
          <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
        {uploadError && <p className="mt-1 text-xs text-[#B42318]">{uploadError}</p>}
      </Panel>

      <Panel title="Fechas importantes">
        <ul className="mb-3 space-y-2">
          {dates.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-btn border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium text-text">{d.label}</span>
              <span className="tabular-nums text-text-2">
                {new Date(d.date).toLocaleDateString("es-AR", { timeZone: "UTC" })}
              </span>
              <button
                type="button"
                onClick={() => removeDate(d.id)}
                className="shrink-0 text-xs text-text-3 hover:text-text"
              >
                Eliminar
              </button>
            </li>
          ))}
          {dates.length === 0 && <li className="text-sm text-text-3">Sin fechas.</li>}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Input
            value={dLabel}
            onChange={(e) => setDLabel(e.target.value)}
            placeholder="Etiqueta"
            className="min-w-[120px] flex-1"
          />
          <Input
            type="date"
            value={dDate}
            onChange={(e) => setDDate(e.target.value)}
            className="w-auto"
          />
          <Button
            type="button"
            variant="primary"
            onClick={addDate}
            disabled={!dLabel.trim() || !dDate}
          >
            Agregar
          </Button>
        </div>
      </Panel>
    </div>
  );
}
