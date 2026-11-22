import type { Roof, StudioDocument } from './document';

/**
 * What one change to a design did, as a person would name it — so Undo and Redo say what they
 * took back or made again (`T-M05-002`, part b). `other`: nothing a person sees changed.
 */
export const STUDIO_CHANGES = [
  'roof_added',
  'roof_deleted',
  'picture',
  'size',
  'height',
  'shape',
  'other',
] as const;
export type StudioChange = (typeof STUDIO_CHANGES)[number];

const sameHeight = (a: Roof, b: Roof) =>
  a.height?.metres === b.height?.metres && a.height?.setBy === b.height?.setBy;

/** The change from `before` to `after`: the biggest one first, as a person would name it. */
export function studioChangeOf(before: StudioDocument, after: StudioDocument): StudioChange {
  if (after.roofs.length > before.roofs.length) return 'roof_added';
  if (after.roofs.length < before.roofs.length) return 'roof_deleted';
  if (after.picture !== before.picture) return 'picture';
  if (after.pictureScale !== before.pictureScale) return 'size';
  const pairs = after.roofs.map((roof, i) => [before.roofs[i] as Roof, roof] as const);
  if (pairs.some(([was, now]) => !sameHeight(was, now))) return 'height';
  if (pairs.some(([was, now]) => was.corners !== now.corners || was.edges !== now.edges)) {
    return 'shape';
  }
  return 'other';
}
