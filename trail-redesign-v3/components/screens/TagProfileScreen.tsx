"use client";

import { useState } from "react";
import {
  ArrowLeft, Pencil, Trash2, ArrowUpRight, CheckSquare,
  Plus, Phone, Mail, FileText, Download, CalendarDays,
} from "lucide-react";
import { Sidebar } from "../Sidebar";
import { MobileNav } from "../ui/MobileNav";
import { TagPill, TagColor } from "../ui/TagPill";

export type TagEntry = {
  id: string;
  dateGroup: string;
  time: string;
  title: string;
  excerpt: string;
  todosDone: number;
  todosTotal: number;
};

export type TagContact = { id: string; name: string; role?: string; phone?: string; email?: string };
export type TagDate = { id: string; label: string; date: string; isPast?: boolean };
export type TagDocument = { id: string; name: string; size: string; addedOn: string };

const DEMO_ENTRIES: TagEntry[] = [
  { id: "1", dateGroup: "Today · Mon, Jul 6", time: "11:37", title: "Post 1",
    excerpt: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit…", todosDone: 0, todosTotal: 3 },
  { id: "2", dateGroup: "Thu, Jul 2", time: "17:09", title: "Leafland",
    excerpt: "Fix styles · Group mark-as-done · Ask Rubén which screens he built…", todosDone: 0, todosTotal: 7 },
];

const DEMO_CONTACTS: TagContact[] = [
  { id: "1", name: "Rubén", role: "Design", phone: "+52 81 0000 0000", email: "ruben@leafland.mx" },
];
const DEMO_DATES: TagDate[] = [
  { id: "1", label: "Demo with client", date: "Jul 15, 2026" },
  { id: "2", label: "Kickoff", date: "Jun 20, 2026", isPast: true },
];
const DEMO_DOCS: TagDocument[] = [
  { id: "1", name: "leafland-proposal.pdf", size: "1.2 MB", addedOn: "Jul 2" },
];

export function TagProfileScreen({
  tagName = "leafland",
  tagColor = "pink" as TagColor,
  entryCount = 2,
  lastActivity = "2m ago",
  description = "",
  entries = DEMO_ENTRIES,
  contacts = DEMO_CONTACTS,
  dates = DEMO_DATES,
  documents = DEMO_DOCS,
  pendingCount = 10,
  onBack,
  onDescriptionChange,
  onDeleteTag,
  onOpenEntry,
  onAddContact,
  onAddDate,
  onUploadDocument,
  onDownloadDocument,
}: {
  tagName?: string;
  tagColor?: TagColor;
  entryCount?: number;
  lastActivity?: string;
  description?: string;
  entries?: TagEntry[];
  contacts?: TagContact[];
  dates?: TagDate[];
  documents?: TagDocument[];
  pendingCount?: number;
  onBack?: () => void;
  onDescriptionChange?: (v: string) => void;
  onDeleteTag?: () => void;
  onOpenEntry?: (id: string) => void;
  onAddContact?: () => void;
  onAddDate?: () => void;
  onUploadDocument?: () => void;
  onDownloadDocument?: (id: string) => void;
}) {
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState(description);
  const [tab, setTab] = useState<"entries" | "details">("entries");

  const groups = entries.reduce<Record<string, TagEntry[]>>((acc, e) => {
    (acc[e.dateGroup] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar active="tags" pendingCount={pendingCount} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 md:px-8 md:py-10">
          <button onClick={onBack}
            className="mb-6 flex items-center gap-1.5 text-sm text-stone-400 transition hover:text-stone-700">
            <ArrowLeft className="h-4 w-4" />
            Tags
          </button>

          <header className="pb-2">
            <div className="flex items-center justify-between">
              <TagPill name={tagName} color={tagColor} />
              <button onClick={onDeleteTag}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-stone-400 transition hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
                Delete tag
              </button>
            </div>
            <p className="mt-2 text-sm text-stone-400">
              {entryCount} {entryCount === 1 ? "entry" : "entries"} · last {lastActivity}
            </p>

            {editingDesc ? (
              <textarea autoFocus value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={() => { setEditingDesc(false); onDescriptionChange?.(desc); }}
                placeholder="What is this tag about…" rows={2}
                className="mt-3 w-full resize-none rounded-md border border-stone-200 bg-white p-3 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-200" />
            ) : (
              <button onClick={() => setEditingDesc(true)}
                className="group mt-3 flex items-center gap-2 text-left text-sm text-stone-500 transition hover:text-stone-800">
                {desc || <span className="text-stone-300">Add a description…</span>}
                <Pencil className="h-3 w-3 text-stone-300 opacity-0 transition group-hover:opacity-100" />
              </button>
            )}
          </header>

          <div className="mt-6 flex gap-5 border-b border-stone-200">
            {(["entries", "details"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-2.5 text-sm capitalize transition ${
                  tab === t
                    ? "border-stone-900 font-medium text-stone-900"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "entries" ? (
            <div className="pt-6">
              {Object.entries(groups).map(([group, groupEntries]) => (
                <section key={group} className="mb-6">
                  <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-stone-400">{group}</h2>
                  <div className="flex flex-col gap-2">
                    {groupEntries.map((e) => (
                      <button key={e.id} onClick={() => onOpenEntry?.(e.id)}
                        className="group rounded-md border border-stone-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-xs tabular-nums text-stone-400">{e.time}</span>
                            <h3 className="font-display text-[16px] text-stone-900">{e.title}</h3>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-300 opacity-0 transition group-hover:opacity-100" />
                        </div>
                        <p className="mt-1 line-clamp-2 pl-[42px] text-sm text-stone-500">{e.excerpt}</p>
                        {e.todosTotal > 0 && (
                          <span className="ml-[42px] mt-2 inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-stone-600">
                            <CheckSquare className="h-3 w-3" />
                            {e.todosDone}/{e.todosTotal}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* ── Details: contacts, important dates, documents ── */
            <div className="pt-6">
              <DetailSection title="Contacts" onAdd={onAddContact} addLabel="Add contact"
                empty={contacts.length === 0} emptyText="People related to this tag — clients, teammates, providers.">
                {contacts.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-stone-900">{c.name}</span>
                      {c.role && <span className="ml-2 text-xs text-stone-400">{c.role}</span>}
                    </div>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900">
                        <Phone className="h-3.5 w-3.5 text-stone-300" />{c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900">
                        <Mail className="h-3.5 w-3.5 text-stone-300" />{c.email}
                      </a>
                    )}
                  </div>
                ))}
              </DetailSection>

              <DetailSection title="Important dates" onAdd={onAddDate} addLabel="Add date"
                empty={dates.length === 0} emptyText="Deadlines, meetings, renewals.">
                {dates.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                    <CalendarDays className="h-4 w-4 shrink-0 text-stone-300" />
                    <span className={`flex-1 text-sm ${d.isPast ? "text-stone-400" : "text-stone-900"}`}>{d.label}</span>
                    <span className={`text-xs tabular-nums ${d.isPast ? "text-stone-300" : "text-stone-500"}`}>{d.date}</span>
                  </div>
                ))}
              </DetailSection>

              <DetailSection title="Documents" onAdd={onUploadDocument} addLabel="Upload"
                empty={documents.length === 0} emptyText="Proposals, contracts, references.">
                {documents.map((doc) => (
                  <div key={doc.id} className="group flex items-center gap-3 px-4 py-3">
                    <FileText className="h-4 w-4 shrink-0 text-stone-300" />
                    <span className="min-w-0 flex-1 truncate text-sm text-stone-900">{doc.name}</span>
                    <span className="text-xs text-stone-400">{doc.size} · {doc.addedOn}</span>
                    <button onClick={() => onDownloadDocument?.(doc.id)} aria-label={`Download ${doc.name}`}
                      className="rounded p-1 text-stone-300 opacity-0 transition hover:bg-stone-100 hover:text-stone-700 group-hover:opacity-100">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </DetailSection>
            </div>
          )}
        </div>
      </main>

      <MobileNav active="tags" pendingCount={pendingCount} />
    </div>
  );
}

function DetailSection({
  title, addLabel, onAdd, empty, emptyText, children,
}: {
  title: string; addLabel: string; onAdd?: () => void;
  empty: boolean; emptyText: string; children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400">{title}</h2>
        <button onClick={onAdd}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-stone-700">
          <Plus className="h-3 w-3" />
          {addLabel}
        </button>
      </div>
      {empty ? (
        <button onClick={onAdd}
          className="w-full rounded-md border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-400 transition hover:border-stone-400 hover:text-stone-600">
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
