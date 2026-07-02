// Paleta curada de tags: el ÚNICO color libre de la UI. Cada tag elige uno al
// crearse (campo Tag.color). La paleta es de 5 tonos con 3 valores cada uno
// (fondo / texto / borde). El dot deriva del borde.

export type TagColorKey = "violet" | "green" | "amber" | "blue" | "pink";

export type TagColor = {
  bg: string;
  text: string;
  border: string;
  dot: string;
};

export const TAG_COLORS: Record<TagColorKey, TagColor> = {
  violet: { bg: "#F4EBFF", text: "#6941C6", border: "#D6BBFB", dot: "#D6BBFB" },
  green: { bg: "#ECFDF3", text: "#067647", border: "#ABEFC6", dot: "#ABEFC6" },
  amber: { bg: "#FEF6EE", text: "#B93815", border: "#F9DBAF", dot: "#F9DBAF" },
  blue: { bg: "#EFF8FF", text: "#175CD3", border: "#B2DDFF", dot: "#B2DDFF" },
  pink: { bg: "#FDF2FA", text: "#C11574", border: "#FCCEEE", dot: "#FCCEEE" },
};

export const TAG_COLOR_KEYS = Object.keys(TAG_COLORS) as TagColorKey[];

export const DEFAULT_TAG_COLOR: TagColorKey = "violet";

export function tagColorByKey(key?: string | null): TagColor {
  if (key && (TAG_COLORS as Record<string, TagColor>)[key]) {
    return (TAG_COLORS as Record<string, TagColor>)[key];
  }
  // ponytail: sin color asignado → determinístico por nombre. Ceiling: dos tags
  // distintos pueden colisionar al mismo color. Upgrade: exigir color al crear.
  const fallback = TAG_COLOR_KEYS[hash(key ?? "") % TAG_COLOR_KEYS.length];
  return TAG_COLORS[fallback];
}

// Resuelve el color de un tag dado su nombre y (opcional) color guardado.
export function tagColor(name: string, color?: string | null): TagColor {
  return color ? tagColorByKey(color) : tagColorByKey(name);
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
