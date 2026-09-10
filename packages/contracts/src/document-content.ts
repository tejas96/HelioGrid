import { z } from 'zod';
import { uiLanguageSchema } from './locale';

/**
 * Content shapes a customer document is made of, shared by the tenant's settings (`M01-51`)
 * and the builder that consumes them (`M06-15`, `M06-51`). Each mirrors a domain type: a
 * per-language value is `PerLanguage<T>`, a body is `RichTextValue`.
 */

/**
 * A value per launch language — English required, the rest optional: `F3-05`'s fallback in the
 * type, exactly domain's `PerLanguage`. The record half is what refuses a language the product
 * has no catalog for.
 */
export function perLanguage<T extends z.ZodTypeAny>(value: T) {
  return z.object({ en: value }).and(z.record(uiLanguageSchema, value));
}

export const labelSchema = z.string().trim().min(1).max(120);
export const lineSchema = z.string().trim().min(1).max(200);
export const paragraphSchema = z.string().trim().min(1).max(2000);

/** A short per-language label — a template name, a tranche label, a phase name. */
export const packLabelSchema = perLanguage(labelSchema);
export type PackLabelWire = z.infer<typeof packLabelSchema>;

/**
 * The one document-content shape (`M06-51`): a block list, never HTML — `RichText` writes it,
 * `RichTextView` reads it, so a document and a link page cannot render one mark two ways.
 */
const richTextSpanSchema = z.object({
  text: z.string(),
  b: z.boolean().optional(),
  i: z.boolean().optional(),
  href: z.string().url().optional(),
});
const richTextBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.enum(['p', 'h']), spans: z.array(richTextSpanSchema) }),
  z.object({
    type: z.enum(['ul', 'ol']),
    items: z.array(z.array(richTextSpanSchema)),
    start: z.number().int().positive().optional(),
  }),
  z.object({ type: z.literal('logo') }),
]);
export const richTextValueSchema = z.object({
  version: z.literal(1),
  blocks: z.array(richTextBlockSchema),
});
export type RichTextValueWire = z.infer<typeof richTextValueSchema>;
