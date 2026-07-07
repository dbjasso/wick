"use client";

import { Plus, Phone, Mail, FileText, Download, CalendarDays } from "lucide-react";

/* Tab "Details" del perfil de tag — las tres secciones del spec:
   contacts, important dates y documents. */

export type TagContact = { id: string; name: string; role?: string; phone?: string; email?: string };
export type TagDate = { id: string; label: string; date: string; isPast?: boolean }; // date: "Aug 15, 2026"
export type TagDocument = { id: string; name: string; size: string; uploadedAt: string };

const DEMO_CONTACTS: TagContact[] = [
  { id: "1", name: "Rubén", role: "Design", phone: "+52 81 1234 5678", email: "ruben@leafland.mx" },
];
const DEMO_DATES: TagDate[] = [
  { id: "1", label: "Delivery deadline", date: "Aug 15, 2026" },
];
const DEMO_DOCS: TagDocument[] = [
  { id: "1", name: "proposal-v2.pdf", size: "1.2 MB", uploadedAt: "Jul 2" },
];

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction?: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400">{title}</h2>
      <button
        onClick={onAction}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
      >
        <Plus className="h-3 w-3" />
        {actionLabel}
      </button>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-stone-200 px-4 py-4 text-center text-sm text-stone-300">
      {text}
    </div>
  );
}

export function TagDetails({
  contacts = DEMO_CONTACTS,
  dates = DEMO_DATES,
  documents = DEMO_DOCS,
  onAddContact,
  onAddDate,
  onUploadDocument,
  onDownloadDocument,
}: {
  contacts?: TagContact[];
  dates?: TagDate[];
  documents?: TagDocument[];
  onAddContact?: () => void;
  onAddDate?: () => void;
  onUploadDocument?: () => void;
  onDownloadDocument?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-7 pt-6">
      {/* Contacts */}
      <section>
        <SectionHeader title="Contacts" actionLabel="Add contact" onAction={onAddContact} />
        {contacts.length === 0 ? (
          <EmptyRow text="No contacts yet" />
        ) : (
          <div className="divide-y divide-stone-100 rounded-md border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold uppercase text-stone-500">
                  {c.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-stone-900">{c.name}</span>
                  {c.role && <span className="ml-2 text-xs text-stone-400">{c.role}</span>}
                </div>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-stone-400 transition hover:text-stone-700">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{c.phone}</span>
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-stone-400 transition hover:text-stone-700">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{c.email}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Important dates */}
      <section>
        <SectionHeader title="Important dates" actionLabel="Add date" onAction={onAddDate} />
        {dates.length === 0 ? (
          <EmptyRow text="No dates yet" />
        ) : (
          <div className="divide-y divide-stone-100 rounded-md border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {dates.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <CalendarDays className="h-4 w-4 shrink-0 text-stone-300" />
                <span className={`flex-1 text-sm ${d.isPast ? "text-stone-400" : "text-stone-800"}`}>{d.label}</span>
                <span className="text-xs font-medium tabular-nums text-stone-500">{d.date}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Documents */}
      <section>
        <SectionHeader title="Documents" actionLabel="Upload" onAction={onUploadDocument} />
        {documents.length === 0 ? (
          <EmptyRow text="No documents yet" />
        ) : (
          <div className="divide-y divide-stone-100 rounded-md border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {documents.map((doc) => (
              <div key={doc.id} className="group flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 shrink-0 text-stone-300" />
                <span className="min-w-0 flex-1 truncate text-sm text-stone-800">{doc.name}</span>
                <span className="text-xs text-stone-400">{doc.size} · {doc.uploadedAt}</span>
                <button
                  onClick={() => onDownloadDocument?.(doc.id)}
                  aria-label={`Download ${doc.name}`}
                  className="rounded p-1 text-stone-300 opacity-0 transition hover:bg-stone-100 hover:text-stone-600 group-hover:opacity-100"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
