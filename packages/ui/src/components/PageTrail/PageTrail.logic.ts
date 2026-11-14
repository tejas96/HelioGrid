import type { PageCrumb } from './PageTrail.types';

/** The page a phone's back goes to: the last one of the trail, or none on a top-level page. */
export function backCrumbOf(trail: readonly PageCrumb[]): PageCrumb | null {
  return trail[trail.length - 1] ?? null;
}
