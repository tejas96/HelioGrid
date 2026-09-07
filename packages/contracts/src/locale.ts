import { UI_LANGUAGES, UI_SOURCE_LOCALE } from '@heliogrid/domain';
import { z } from 'zod';

/**
 * UI language identity — the wire and validation half of the set.
 *
 * **The set itself is authored in `packages/domain`** (`format/languages.ts`): a pack
 * declares its display labels per language (`F1-22`), domain owns the pack, and domain imports
 * nothing in the workspace — so the tuple has to sit below this package and this one derives from
 * it, exactly as it does for `ROLE_PRESETS`. Re-exported here so `packages/i18n`, the apps and the
 * enum-parity invariant keep one import site; moving the authorship moved no consumer.
 *
 * This file still exists rather than folding into `common.ts` because its consumers are not all
 * contracts: `packages/i18n` derives its metadata table, its catalog loaders and its Lingui CLI
 * configuration from these exports, and a `lingui.config.js` reaching into a grab-bag of
 * pagination and money schemas to find a locale list is how a second list gets written instead.
 *
 * Per-USER, not per-tenant (D25). Distinct from the tenant's MARKET, which decides currency
 * grouping, tax scheme and paperwork — a Marathi-reading user in an Indian tenant still
 * sees INR in lakh/crore grouping. Never derive one from the other.
 *
 * The agent/voice language set is broader (it includes languages we have no UI catalog
 * for) and lives with the agent contract.
 */
export { UI_LANGUAGES, UI_SOURCE_LOCALE };

export const uiLanguageSchema = z.enum(UI_LANGUAGES);
export type UiLanguage = z.infer<typeof uiLanguageSchema>;
