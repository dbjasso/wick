"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export type CommentData = {
  id: string;
  content: string;
  createdAt: string; // ISO
};

export function CommentsSection({
  recordId,
  initial,
}: {
  recordId: string;
  initial: CommentData[];
}) {
  const [comments, setComments] = useState<CommentData[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function add() {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      const res = await fetch(`/api/records/${recordId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "no se pudo agregar");
      setComments((c) => [...c, data as CommentData]);
      setText("");
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) setComments((c) => c.filter((x) => x.id !== id));
  }

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-3">
        Comentarios
      </h2>
      <ul className="mb-4 space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded-card border border-border bg-surface px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 whitespace-pre-wrap break-words text-text">
                {c.content}
              </div>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="shrink-0 rounded-btn px-1.5 py-0.5 text-xs text-text-3 hover:bg-surface-2 hover:text-text"
                aria-label="Eliminar comentario"
              >
                ✕
              </button>
            </div>
            <div className="mt-1 text-xs tabular-nums text-text-3">
              {new Date(c.createdAt).toLocaleString("es-AR")}
            </div>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-text-3">Sin comentarios.</li>
        )}
      </ul>
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Agregar un comentario…"
          className="flex-1 rounded-btn border border-border-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <Button
          type="button"
          variant="primary"
          onClick={add}
          disabled={sending || !text.trim()}
        >
          {sending ? "…" : "Agregar"}
        </Button>
      </div>
    </section>
  );
}
