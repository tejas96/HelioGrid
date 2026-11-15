/**
 * The sections of step 8 (`M06-27`): five every proposal fills, and the battery once one is added.
 * A readonly tuple in the order the step and the document draw them. A leaf file: the market pack
 * names the categories a certification scheme binds (`certification/pack.ts`), so it imports nothing.
 */
export const COMPONENT_CATEGORIES = [
  'panel',
  'inverter',
  'cable',
  'electrical',
  'structure',
  'battery',
] as const;
export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

/** The five every proposal must fill (`M06-27`); the battery joins only when the system holds one. */
export const MANDATORY_COMPONENT_CATEGORIES: readonly ComponentCategory[] = [
  'panel',
  'inverter',
  'cable',
  'electrical',
  'structure',
];

/** Only these carry a count, and it is required at Generate (`M06-23`, `M06-27`). */
export const COUNTED_COMPONENT_CATEGORIES: readonly ComponentCategory[] = ['panel', 'inverter'];

export function isCountedCategory(category: ComponentCategory): boolean {
  return COUNTED_COMPONENT_CATEGORIES.includes(category);
}

/**
 * Where a category's brands are picked from (`M06-28`): the catalog, or the company's own saved
 * parts list — brand, specification, warranty, description, and no price, count or stock.
 */
export const SAVED_PART_KINDS = ['cable', 'electrical', 'structure'] as const;
export type SavedPartKind = (typeof SAVED_PART_KINDS)[number];

export function isSavedPartKind(category: ComponentCategory): category is SavedPartKind {
  return (SAVED_PART_KINDS as readonly string[]).includes(category);
}
