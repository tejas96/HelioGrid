import type { UiLanguage } from '@heliogrid/contracts';
import type { Messages } from '@lingui/core';
import { messages as en } from './locales/en/messages';
import { messages as hi } from './locales/hi/messages';
import { messages as mr } from './locales/mr/messages';

/**
 * REACT NATIVE catalog loading — every catalog is already in the app, so "loading" is a
 * lookup. Metro substitutes this file for `catalog-loader.ts` at bundle time.
 *
 * The fork is REQUIRED, not a preference. React Native ships ONE bundle: in a release build
 * Metro inlines an `import()` and resolves it from that bundle, but against the DEV SERVER
 * the same call goes through `__loadBundleAsync` and fails with
 * `LoadBundleFromServerError: Could not load bundle` — proven on the iOS simulator
 * 2026-08-25, where switching to Hindi threw and the UI stayed English. A loader that works
 * only in release builds is worse than no lazy loading at all.
 *
 * It costs nothing to load them all here: the catalogs are in the bundle either way, and a
 * field device on a bad connection has nothing to fetch them from.
 *
 * The signature is IDENTICAL to the web half — still a Promise — so nothing above this file
 * branches on platform. Same `satisfies` exhaustiveness: a new contract language fails to
 * compile here too, not just on web.
 */
const CATALOGS = { en, hi, mr } satisfies Record<UiLanguage, Messages>;

export async function loadCatalog(locale: UiLanguage): Promise<Messages> {
  return CATALOGS[locale];
}
