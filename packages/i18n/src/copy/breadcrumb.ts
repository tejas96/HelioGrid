/**
 * `Breadcrumb`'s own word (`packages/ui`'s `Breadcrumb`): the trail's landmark name. The crumbs
 * are the pages' and records' own names.
 */
import type { Translator } from '../runtime';

export const BREADCRUMB = {
  label: /*i18n*/ { id: 'Breadcrumb' },
} as const;

/** The trail's landmark name, as `Breadcrumb` takes it. */
export function breadcrumbWords(t: Translator['t']) {
  return { label: t(BREADCRUMB.label) };
}
