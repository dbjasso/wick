"use client";

import { useState } from "react";
import {
  Plus,
  Phone,
  Mail,
  FileText,
  Download,
  CalendarDays,
  Trash2,
} from "lucide-react";
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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDocDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatImportantDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function DetailSection({
  title,
  addLabel,
  onAdd,
  empty,
  emptyText,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd?: () => void;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400">
          {title}
        </h2>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <Plus className="h-3 w-3" />
            {addLabel}
          </button>
        )}
      </div>
      {empty ? (
        <button
          type="button"
          onClick={onAdd}
          className="w-full rounded-md border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-400 transition hover:border-stone-400 hover:text-stone-600"
        >
          {emptyText}
        </button>
      ) : (
        <div className="divide-y divide-stone-100 rounded-md border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {children}
        </div>
      )}
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
  const [addingContact, setAddingContact] = useState(false);
  const [addingDate, setAddingDate] = useState(false);
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
      setAddingContact(false);
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
      setAddingDate(false);
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
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDocs((d) => [...d, data as DocumentItem]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removeDoc(id: string, filename: string) {
    if (!confirm(`Delete document "${filename}"?`)) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) setDocs((d) => d.filter((x) => x.id !== id));
  }

  const now = Date.now();

  return (
    <div className="pt-6">
      <DetailSection
        title="Contacts"
        addLabel="Add contact"
        onAdd={() => setAddingContact(true)}
        empty={contacts.length === 0 && !addingContact}
        emptyText="People related to this tag — clients, teammates, providers."
      >
        {contacts.map((c) => (
          <div key={c.id} className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-stone-900">{c.name}</span>
            </div>
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900"
              >
                <Phone className="h-3.5 w-3.5 text-stone-300" />
                {c.phone}
              </a>
            )}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900"
              >
                <Mail className="h-3.5 w-3.5 text-stone-300" />
                {c.email}
              </a>
            )}
            <button
              type="button"
              onClick={() => removeContact(c.id)}
              className="rounded p-1 text-stone-300 opacity-0 transition hover:bg-stone-100 hover:text-stone-600 group-hover:opacity-100"
              aria-label={`Remove ${c.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </DetailSection>

      {addingContact && (
        <div className="mb-7 rounded-md border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="space-y-2">
            <Input
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Name"
              autoFocus
              className="border-stone-200"
            />
            <div className="flex gap-2">
              <Input
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 border-stone-200"
              />
              <Input
                value={cPhone}
                onChange={(e) => setCPhone(e.target.value)}
                placeholder="Phone"
                className="flex-1 border-stone-200"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => void addContact()}
                disabled={!cName.trim()}
                className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
              >
                Add contact
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingContact(false);
                  setCName("");
                  setCEmail("");
                  setCPhone("");
                }}
                className="rounded-md px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailSection
        title="Important dates"
        addLabel="Add date"
        onAdd={() => setAddingDate(true)}
        empty={dates.length === 0 && !addingDate}
        emptyText="Deadlines, meetings, renewals."
      >
        {dates.map((d) => {
          const isPast = new Date(d.date).getTime() < now;
          return (
            <div key={d.id} className="group flex items-center gap-3 px-4 py-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-stone-300" />
              <span
                className={`flex-1 text-sm ${isPast ? "text-stone-400" : "text-stone-900"}`}
              >
                {d.label}
              </span>
              <span
                className={`text-xs tabular-nums ${isPast ? "text-stone-300" : "text-stone-500"}`}
              >
                {formatImportantDate(d.date)}
              </span>
              <button
                type="button"
                onClick={() => removeDate(d.id)}
                className="rounded p-1 text-stone-300 opacity-0 transition hover:bg-stone-100 hover:text-stone-600 group-hover:opacity-100"
                aria-label={`Remove ${d.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </DetailSection>

      {addingDate && (
        <div className="mb-7 rounded-md border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap gap-2">
            <Input
              value={dLabel}
              onChange={(e) => setDLabel(e.target.value)}
              placeholder="Label"
              autoFocus
              className="min-w-[120px] flex-1 border-stone-200"
            />
            <Input
              type="date"
              value={dDate}
              onChange={(e) => setDDate(e.target.value)}
              className="w-auto border-stone-200"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void addDate()}
              disabled={!dLabel.trim() || !dDate}
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
            >
              Add date
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingDate(false);
                setDLabel("");
                setDDate("");
              }}
              className="rounded-md px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <DetailSection
        title="Documents"
        addLabel="Upload"
        onAdd={() => document.getElementById(`tag-doc-upload-${tagId}`)?.click()}
        empty={docs.length === 0}
        emptyText="Proposals, contracts, references."
      >
        {docs.map((doc) => (
          <div key={doc.id} className="group flex items-center gap-3 px-4 py-3">
            <FileText className="h-4 w-4 shrink-0 text-stone-300" />
            <a
              href={`/api/documents/${doc.id}`}
              className="min-w-0 flex-1 truncate text-sm text-stone-900 hover:underline"
            >
              {doc.filename}
            </a>
            <span className="text-xs text-stone-400">
              {formatBytes(doc.size)} · {formatDocDate(doc.uploadedAt)}
            </span>
            <a
              href={`/api/documents/${doc.id}`}
              download
              aria-label={`Download ${doc.filename}`}
              className="rounded p-1 text-stone-300 opacity-0 transition hover:bg-stone-100 hover:text-stone-700 group-hover:opacity-100"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => void removeDoc(doc.id, doc.filename)}
              className="rounded p-1 text-stone-300 opacity-0 transition hover:bg-stone-100 hover:text-stone-600 group-hover:opacity-100"
              aria-label={`Delete ${doc.filename}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </DetailSection>

      <input
        id={`tag-doc-upload-${tagId}`}
        type="file"
        className="hidden"
        onChange={onUpload}
        disabled={uploading}
      />
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      {uploading && <p className="text-xs text-stone-400">Uploading…</p>}
    </div>
  );
}
