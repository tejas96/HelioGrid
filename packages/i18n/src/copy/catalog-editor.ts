import type { ReleaseChangeKind } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/**
 * Catalog settings' sheets and dialogs (`SCR-M01-15`): the price editor, the archive warning,
 * the publish summary and a release's before-and-after, chosen once for both apps (Law 11).
 */
export const CATALOG_EDITOR = {
  platformItem: /*i18n*/ { id: 'Platform item' },
  ownItem: /*i18n*/ { id: 'Your SKU' },
  howItResolves: /*i18n*/ { id: 'How these fields resolve' },
  resolvesPrice: /*i18n*/ {
    id: "A platform item's price comes from your override and nowhere else; the platform list carries none.",
  },
  resolvesUnset: /*i18n*/ {
    id: 'A field you leave unset falls through: tax to the market rate, pickers and ranking to their defaults.',
  },
  yourPrice: /*i18n*/ { id: 'Your price' },
  price: /*i18n*/ { id: 'Price' },
  priceHint: /*i18n*/ { id: 'Clear it and this item has no price.' },
  taxRate: /*i18n*/ { id: 'Tax rate' },
  noMarketRate: /*i18n*/ { id: 'No market rate yet' },
  taxStays: /*i18n*/ { id: 'No market rate yet. Your {rate} stays until one is set.' },
  yourOverride: /*i18n*/ { id: 'Your override' },
  defaultSource: /*i18n*/ { id: 'Default' },
  inPickers: /*i18n*/ { id: 'In search and pickers' },
  hideFromPickers: /*i18n*/ { id: 'Hide from pickers' },
  preferredInPickers: /*i18n*/ { id: 'Preferred in search and pickers' },
  cancel: /*i18n*/ { id: 'Cancel' },
  saveOverride: /*i18n*/ { id: 'Save override' },
  savePrice: /*i18n*/ { id: 'Save price' },
  saveFailed: /*i18n*/ { id: "That didn't save. Nothing changed — try again." },
  close: /*i18n*/ { id: 'Close' },
  archiveTitle: /*i18n*/ { id: 'Archive {name}?' },
  archiveDrafts: /*i18n*/ {
    id: '{count, plural, one {# open draft keeps it and its price; it leaves every picker until restored.} other {# open drafts keep it and its price; it leaves every picker until restored.}}',
  },
  archiveIt: /*i18n*/ { id: 'Archive it' },
  keepIt: /*i18n*/ { id: 'Keep it' },
  archived: /*i18n*/ { id: 'Archived {name}' },
  archivedBody: /*i18n*/ { id: 'It has left every picker.' },
  undo: /*i18n*/ { id: 'Undo' },
  undoFailed: /*i18n*/ {
    id: "{name} couldn't be restored. It is still archived — restore it from the Archived filter.",
  },
  restored: /*i18n*/ { id: 'Restored {name}' },
  publishTitle: /*i18n*/ { id: 'Publish a new release' },
  publishReplaces: /*i18n*/ { id: 'Replaces {label} for every new proposal.' },
  publishFirst: /*i18n*/ { id: 'Your first release. Every new proposal will use it.' },
  releaseName: /*i18n*/ { id: 'Release name' },
  moreChanges: /*i18n*/ { id: 'Show more changes' },
  staleCountAbsent: /*i18n*/ {
    id: 'Designs pinned to {label} will show as out of date. Their count is not available yet.',
  },
  labelTaken: /*i18n*/ { id: 'A release already has this name. Choose another name.' },
  nothingChanged: /*i18n*/ {
    id: 'Nothing has changed since the last release, so there is nothing to publish.',
  },
  publishFailed: /*i18n*/ { id: "The release wasn't published. Nothing changed — try again." },
  releases: /*i18n*/ { id: 'Releases' },
  releasesCount: /*i18n*/ {
    id: '{count, plural, one {# release} other {# releases}} · newest first',
  },
  inForce: /*i18n*/ { id: 'In force' },
  inForceSince: /*i18n*/ { id: 'In force since {date}' },
  earlier: /*i18n*/ { id: 'Earlier releases' },
  newValue: /*i18n*/ { id: 'New' },
  noValue: /*i18n*/ { id: 'None' },
  yes: /*i18n*/ { id: 'Yes' },
  no: /*i18n*/ { id: 'No' },
  shown: /*i18n*/ { id: 'Shown' },
  hiddenWord: /*i18n*/ { id: 'Hidden' },
  pickers: /*i18n*/ { id: 'Pickers' },
  preferred: /*i18n*/ { id: 'Preferred' },
  releaseLoadFailed: /*i18n*/ { id: "This release didn't load." },
  tryAgain: /*i18n*/ { id: 'Try again' },
} as const;

/** A release's change kinds as a tile's word and a group's overline. */
const CHANGE: Record<ReleaseChangeKind, { id: string }> = {
  added: /*i18n*/ { id: 'Added' },
  changed: /*i18n*/ { id: 'Changed' },
  archived: /*i18n*/ { id: 'Archived' },
};

export const releaseChangeWord = (t: Translator['t'], kind: ReleaseChangeKind) => t(CHANGE[kind]);
