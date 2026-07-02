import { z } from "zod";
import { TAG_COLOR_KEYS, type TagColorKey } from "@/lib/tag-colors";

const tagColorSchema = z.enum(TAG_COLOR_KEYS as [TagColorKey, ...TagColorKey[]]);

// Contenido TipTap = JSON arbitrario (doc). Lo validamos como unknown y Prisma
// lo persiste como Json. La sanitización profunda se trata en la Tarea 8.
const contentSchema = z.unknown();

// Un tag puede mandarse como string (compat) o como { name, color? }.
// color sólo aplica al crear un tag nuevo; en upsert el update es {}.
const tagInputSchema = z.union([
  z.string().min(1).max(50),
  z.object({
    name: z.string().min(1).max(50),
    color: tagColorSchema.nullish(),
    description: z.string().max(500).nullish(),
  }),
]);

export const createRecordSchema = z.object({
  date: z.string().datetime().optional(),
  content: contentSchema.optional(),
  tags: z.array(tagInputSchema).optional(),
});

// PATCH: todos los campos opcionales (update parcial, usado por el autosave).
export const updateRecordSchema = z.object({
  date: z.string().datetime().optional(),
  content: contentSchema.optional(),
  tags: z.array(tagInputSchema).optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: tagColorSchema,
  description: z.string().max(500).optional(),
});

export const patchTagSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  color: tagColorSchema.optional(),
  description: z.string().max(500).nullable().optional(),
});

export const createContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
});

export const createImportantDateSchema = z.object({
  label: z.string().min(1).max(100),
  date: z.string().datetime(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});
