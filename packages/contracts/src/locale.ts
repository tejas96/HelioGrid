import { z } from 'zod';

/**
 * UI language identity — the ONE place the supported language set is written.
 *
 * It sits in its own file, not in common.ts, because it has consumers that are not
 * contracts: `packages/i18n` derives its metadata table, its catalog loaders and its
 * Lingui CLI configuration from these exports, and a `lingui.config.js` reaching into a
 * grab-bag of pagination and money schemas to find a locale list is how a second list gets
 * written instead. One fact, one file, one import.
 *
 * Per-USER, not per-tenant (D25). Distinct from the tenant's MARKET, which decides currency
 * grouping, tax scheme and paperwork — a Marathi-reading user in an Indian tenant still
 * sees INR in lakh/crore grouping. Never derive one from the other.
 *
 * The agent/voice language set is broader (it includes languages we have no UI catalog
 * for) and lives with the agent contract.
 */
export const UI_LANGUAGES = ['en', 'hi', 'mr'] as const;

/**
 * The language message IDs are authored in. Lingui's `sourceLocale`: its catalog needs no
 * translation because the id IS the English text (packages/i18n/CLAUDE.md, THE CONVENTION).
 */
export const UI_SOURCE_LOCALE = 'en' satisfies (typeof UI_LANGUAGES)[number];

export const uiLanguageSchema = z.enum(UI_LANGUAGES);
export type UiLanguage = z.infer<typeof uiLanguageSchema>;
