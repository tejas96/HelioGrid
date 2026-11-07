/**
 * The letter a language's card shows in its chip: the first character of the language's own name —
 * E for English, ह for हिन्दी, म for मराठी — so each card reads in its own script at a glance.
 */
export function languageGlyph(ownName: string): string {
  return Array.from(ownName)[0] ?? '';
}
