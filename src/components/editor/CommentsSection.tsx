"use client";

import { useState } from "react";

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
};

export function CommentsSection({
  recordId,
  initial,
  authorInitials = "DI",
}: {
  recordId: string;
  initial: CommentData[];
  authorInitials?: string;
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
    <div className="rounded-2xl border border-[#E7E5DF] bg-white px-7 py-5">
      <p className="text-xs tracking-[2px] text-[#8a8a84]">COMENTARIOS</p>

      {comments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#ECEAE5] text-xs font-semibold text-[#1a1a1a]">
                {authorInitials}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap break-words text-sm text-[#1a1a1a]">{c.content}</p>
                  <button
                    type="button"
                    onClick={() => void remove(c.id)}
                    className="shrink-0 text-xs text-[#b5b3ad] hover:text-[#1a1a1a]"
                    aria-label="Eliminar comentario"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-0.5 text-[11px] tabular-nums text-[#b5b3ad]">
                  {new Date(c.createdAt).toLocaleString("es-AR")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3.5 flex items-center gap-3">
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#ECEAE5] text-xs font-semibold text-[#1a1a1a]">
          {authorInitials}
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
          placeholder="Agregar un comentario…"
          className="min-w-0 flex-1 rounded-[10px] border border-[#DEDCD6] px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#b5b3ad] focus:border-[#c9c6bf] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-[10px] bg-[#EFEDE8] px-[18px] py-2.5 text-sm font-medium text-[#8a8a84] transition hover:bg-[#E7E5DF] disabled:opacity-50"
        >
          {sending ? "…" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
