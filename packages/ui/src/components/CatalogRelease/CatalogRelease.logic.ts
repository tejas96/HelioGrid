import { RELEASE_CHANGE_KINDS } from '@heliogrid/domain';
import type { TextColor } from '../../primitives/Text/Text.types';
import type { CatalogReleaseChanges, CatalogReleaseItem } from './CatalogRelease.types';

type ChangeKind = CatalogReleaseItem['kind'];

const CHANGE_ORDER: readonly ChangeKind[] = RELEASE_CHANGE_KINDS;

/** A count tile's numeral ink; the word under it carries the kind (`F7-12`). */
export const RELEASE_CHANGE_INK: Readonly<Record<ChangeKind, TextColor>> = {
  added: 'success',
  changed: 'info',
  archived: 'secondary',
};

export interface ReleaseGroup {
  readonly kind: ChangeKind;
  /** The kind's word, from the release's own counts. */
  readonly word: string;
  readonly items: readonly CatalogReleaseItem[];
}

/** The release's items under their kind — added, changed, archived — with no empty group. */
export function releaseGroups(changes: CatalogReleaseChanges): ReleaseGroup[] {
  return CHANGE_ORDER.flatMap((kind) => {
    const items = changes.items.filter((item) => item.kind === kind);
    const word = changes.counts.find((each) => each.kind === kind)?.word;
    return items.length === 0 || word === undefined ? [] : [{ kind, word, items }];
  });
}
