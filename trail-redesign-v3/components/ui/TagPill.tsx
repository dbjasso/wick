import { X } from "lucide-react";

export type TagColor = "pink" | "violet" | "blue" | "green" | "amber" | "red";

const STYLES: Record<TagColor, { dot: string; text: string; bg: string }> = {
  pink:   { dot: "bg-pink-500",   text: "text-pink-700",   bg: "bg-pink-50" },
  violet: { dot: "bg-violet-500", text: "text-violet-700", bg: "bg-violet-50" },
  blue:   { dot: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50" },
  green:  { dot: "bg-emerald-500",text: "text-emerald-700",bg: "bg-emerald-50" },
  amber:  { dot: "bg-amber-500",  text: "text-amber-700",  bg: "bg-amber-50" },
  red:    { dot: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50" },
};

export function TagPill({
  name,
  color = "pink",
  size = "sm",
  onRemove,
  onClick,
}: {
  name: string;
  color?: TagColor;
  size?: "xs" | "sm";
  onRemove?: () => void;
  onClick?: () => void;
}) {
  const s = STYLES[color];
  const sizing = size === "xs" ? "text-[11px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded font-medium ${s.bg} ${s.text} ${sizing} ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 opacity-50 hover:opacity-100"
          aria-label={`Remove tag ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
