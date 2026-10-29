import type { TranslatedText } from '@heliogrid/contracts';
import type { ExplainerPagerWords, Read, RolePreset, UncountedHolder } from '@heliogrid/domain';

/**
 * **Roles reference** (`SCR-M01-14`, `M01-21`): the twelve fixed roles as tiles with how many active
 * people hold each, and one role's details — its holders, then what it can and cannot do — in a
 * sheet at 375 and a side panel at 1536. Read-only: nothing here changes a role. The words are the
 * caller's (`@heliogrid/i18n`'s `rolesReferenceWords`), and each list is `@heliogrid/domain`'s.
 */
export interface RolesReferenceProps {
  words: RolesReferenceWordsProp;
  /**
   * The Team roster's read, which the holder counts come from; a failed one draws the banner and its
   * *Try again*. The roles, their words and their lists never wait.
   */
  read: Read<unknown>;
  /**
   * `page` — the page draws its own title, with the ask beside it and the lede under it (the web);
   * `bar` — the screen's bar holds the title, so the lede leads with the ask beside it (the phone).
   */
  title: 'page' | 'bar';
  /**
   * The round way back before the title when the page was opened from Assign Roles, naming it
   * (`d-from-assign`). Drawn only with `title="page"`: under `bar` the bar holds the way back.
   */
  back?: RolesReferenceBack | null;
}

export interface RolesReferenceBack {
  readonly label: TranslatedText;
  readonly onPress: () => void;
}

export interface RolesReferenceWordsProp {
  readonly title: TranslatedText;
  /** The phone's lede (*Tap one…*); `ledeWide` where a pointer chooses (*Choose one…*). */
  readonly lede: TranslatedText;
  readonly ledeWide: TranslatedText;
  readonly about: ExplainerPagerWords & {
    readonly label: TranslatedText;
    readonly pages: readonly [TranslatedText, TranslatedText];
  };
  /** The tiles' group name. */
  readonly roles: TranslatedText;
  readonly countGap: TranslatedText;
  readonly countsFailed: TranslatedText;
  readonly retry: TranslatedText;
  readonly nobody: TranslatedText;
  readonly show: TranslatedText;
  readonly close: TranslatedText;
  readonly presets: readonly RolesReferencePreset[];
}

/** One role's words: its tile, and its details. */
export interface RolesReferencePreset {
  readonly value: RolePreset;
  readonly name: TranslatedText;
  readonly summary: TranslatedText;
  /** *2 people*, or null while the counts are out or did not load. */
  readonly count: TranslatedText | null;
  /** The count's wait, spoken: *Loading how many people hold Finance*. */
  readonly loadingCount: TranslatedText;
  /** The active holders' names, as they were typed. */
  readonly holders: readonly string[];
  readonly others: readonly (UncountedHolder & { readonly word: TranslatedText })[];
  readonly canTab: TranslatedText;
  readonly cantTab: TranslatedText;
  readonly canList: TranslatedText;
  readonly cantList: TranslatedText;
  readonly can: readonly RolesReferenceLine[];
  readonly cant: readonly RolesReferenceLine[];
}

export interface RolesReferenceLine {
  readonly key: string;
  readonly text: TranslatedText;
  /** The person's part of a scoped grant, after a *·*; null for a plain one. */
  readonly scope: TranslatedText | null;
}

/** Which list the details show (`Show`), opening on *Can do*. */
export type RolesReferenceSide = 'can' | 'cant';
