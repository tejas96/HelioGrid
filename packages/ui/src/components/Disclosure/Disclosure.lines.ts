import { RULED_DISCLOSURES, type RuledDisclosure } from '@heliogrid/domain';
import type { DisclosureKind } from './Disclosure.types';

/** The canonical document order: `domain`'s ruled lines, basis first, then a caller's own. */
export const DISCLOSURE_ORDER: readonly DisclosureKind[] = [...RULED_DISCLOSURES, 'custom'];

/** A ruled kind, or `null` for `custom` — the one kind whose `text` is read. */
export function ruledKind(kind: DisclosureKind): RuledDisclosure | null {
  return kind === 'custom' ? null : kind;
}
