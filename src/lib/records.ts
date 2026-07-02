import { prisma } from "@/lib/prisma";

export type TagInput = string | { name: string; color?: string | null; description?: string | null };

// Sincroniza los tags de un registro a exactamente el conjunto dado. Acepta
// nombres sueltos o { name, color?, description? }. El color/descripción sólo se
// aplica al CREAR un tag nuevo; los existentes conservan sus valores.
export async function syncRecordTags(recordId: string, tags: TagInput[]) {
  const norm = tags.map((t) =>
    typeof t === "string"
      ? { name: t }
      : { name: t.name, color: t.color, description: t.description },
  );
  const upserted = await Promise.all(
    norm.map(({ name, color, description }) =>
      prisma.tag.upsert({
        where: { name },
        create: {
          name,
          ...(color ? { color } : {}),
          ...(description ? { description } : {}),
        },
        update: {},
      }),
    ),
  );
  await prisma.record.update({
    where: { id: recordId },
    data: { tags: { set: upserted.map((t) => ({ id: t.id })) } },
  });
}
