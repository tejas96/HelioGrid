import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

export type ScopeNoteVariant = 'line' | 'panel';
export type ScopeNoteAlign = 'left' | 'center';

/**
 * **The act is absent, and this says whose it is.** `M12-56` / `SCR-M12-02`'s
 * `non-owner-read-only`: *"the state is visible, the acts are not; the screen says whose act it
 * is"*. Plus `SCR-M11-02`'s `reader-read-only`, `SCR-M02-06`'s `scope-blocked` and
 * `SCR-SHELL-06`'s `no-amounts-for-employees`.
 *
 * **Why this is not a disabled button.** A greyed control still advertises a capability — *"this
 * act is yours, just not yet"* — which is false for a reader on someone else's ledger and invites
 * a tap that can never succeed. The control is therefore **not rendered**, and this takes the
 * space it would have had. The precondition case is `ActionReason`; the compliance case, where
 * nobody holds the act, is `ComplianceFloor` — this component's sentence names a holder, and there
 * is no holder to name.
 */
interface ScopeNoteCommon {
  /**
   * Whose act it is — named, not a role code: "the owner", "Priya Menon (owner)", "your manager".
   * "You don't have permission" tells a rep nothing they can act on; a name tells them who to call.
   */
  holder?: string;
  /** The absent acts as lowercase verb phrases: `["approve pricing", "record a payment"]`. */
  acts?: TranslatedText | TranslatedText[];
  /** What the reader still has — "Everything on this screen stays readable." */
  message?: TranslatedText;
  /** One forward action, and never a retry of the absent act: "Ask Priya to approve". */
  action?: ReactNode;
  /** `line` in an action row; `panel` (a flat `--neutral-bg` block) where it replaces a bar. */
  variant?: ScopeNoteVariant;
  align?: ScopeNoteAlign;
  /** 13 (default) or 12. Never below 12 — the type floor. */
  size?: number;
}

/** The first sentence, composed from `holder` and `acts` in the reader's language. */
export interface ScopeNoteWords {
  /** "Only Priya Menon (owner) can approve pricing or record a payment." — no acts: "can act on this". */
  readonly onlyHolder: (holder: string, acts: readonly TranslatedText[]) => TranslatedText;
  /** "Approve pricing is not yours to take." — never called with no acts. */
  readonly notYours: (acts: readonly TranslatedText[]) => TranslatedText;
}

/** The screen wrote the first sentence itself. */
interface ScopeNoteTitled extends ScopeNoteCommon {
  /** Replaces the composed first sentence outright. */
  title: TranslatedText;
  words?: undefined;
}

/** The first sentence is composed: whose act it is. */
interface ScopeNoteComposed extends ScopeNoteCommon {
  title?: undefined;
  words: ScopeNoteWords;
}

export type ScopeNoteSpec = ScopeNoteTitled | ScopeNoteComposed;

export type ScopeNoteProps = ScopeNoteSpec;
