import type { UiLanguage } from '@heliogrid/contracts';
import type { Messages } from '@lingui/core';

/**
 * WEB catalog loading — one HTTP chunk per language, fetched on switch.
 *
 * Each specifier is a STATIC STRING LITERAL, which is load-bearing: webpack and Turbopack
 * only code-split an `import()` they can read at build time. A template literal or a
 * computed path silently collapses every catalog into the initial chunk.
 *
 * There is a `.native.ts` sibling, and the split is NOT stylistic — see its header.
 */
const CATALOG_LOADERS = {
  en: () => import('./locales/en/messages.js'),
  hi: () => import('./locales/hi/messages.js'),
  mr: () => import('./locales/mr/messages.js'),
} satisfies Record<UiLanguage, () => Promise<{ messages: Messages }>>;

export async function loadCatalog(locale: UiLanguage): Promise<Messages> {
  return (await CATALOG_LOADERS[locale]()).messages;
}
