import type { ReleaseChangeKind } from '@heliogrid/domain';

/**
 * **A catalog release's body** (`SCR-M01-15`, `M01-43`): the publish summary — a name for the
 * release and what it will carry — and a published release's contents as a before-and-after,
 * with the earlier releases under it. The app holds it in a sheet at 375 and a modal (publish) or
 * the same sheet's place at 1536, and draws the foot there. Words are the caller's.
 */
export type CatalogReleaseProps = CatalogPublishBody | CatalogContentsBody;

export interface CatalogPublishBody {
  readonly mode: 'publish';
  readonly words: CatalogReleaseWords;
  readonly label: string;
  readonly onLabel: (label: string) => void;
  /** Under the name: *A release already has this name…*; `null` while there is none. */
  readonly problem: string | null;
  /** What the release will carry; `null` while it is still being read. */
  readonly changes: CatalogReleaseChanges | null;
  /** The preview's read: the dialog waits, or says it failed with *Try again*. */
  readonly surface: 'loading' | 'error' | 'ready';
  readonly onRetry: () => void;
  /** The next page of change cards, while more remain than are shown; `null` when all are. */
  readonly more: { readonly label: string; readonly onMore: () => void } | null;
}

export interface CatalogContentsBody {
  readonly mode: 'contents';
  readonly words: CatalogReleaseWords;
  /** The release opened: its tag, when, and whether it is the one in force. */
  readonly release: {
    readonly tag: string;
    readonly when: string;
    readonly inForce: boolean;
  } | null;
  readonly changes: CatalogReleaseChanges | null;
  readonly surface: 'loading' | 'error' | 'ready';
  readonly onRetry: () => void;
  /** Releases before the open one, newest first. */
  readonly earlier: readonly CatalogEarlierRelease[];
  readonly onOpenEarlier: (id: string) => void;
}

/** The count tiles and the change cards, grouped by kind. */
export interface CatalogReleaseChanges {
  readonly counts: readonly {
    readonly kind: ReleaseChangeKind;
    readonly count: number;
    readonly word: string;
  }[];
  readonly items: readonly CatalogReleaseItem[];
}

export interface CatalogReleaseItem {
  readonly id: string;
  readonly name: string;
  readonly kind: ReleaseChangeKind;
  readonly fields: readonly CatalogReleaseField[];
}

/** One field's move: *Price* New → ₹14,900, or *Preferred* ~~No~~ → Yes. */
export interface CatalogReleaseField {
  readonly field: string;
  /** `null` is an addition, drawn as *New*. */
  readonly from: string | null;
  readonly to: string;
  /** Money and figures are set in the mono face (`F7-09`). */
  readonly figure: boolean;
}

export interface CatalogEarlierRelease {
  readonly id: string;
  readonly tag: string;
  readonly when: string;
}

/** `@heliogrid/i18n`'s `catalogReleaseWords`. */
export interface CatalogReleaseWords {
  readonly releaseName: string;
  readonly newValue: string;
  readonly inForce: string;
  readonly earlier: string;
  readonly loadFailed: string;
  readonly tryAgain: string;
  readonly loading: string;
}
