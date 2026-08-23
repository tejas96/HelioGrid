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
export interface ScopeNoteSpec {
  /**
   * Whose act it is — named, not a role code: "the owner", "Priya Menon (owner)", "your manager".
   * "You don't have permission" tells a rep nothing they can act on; a name tells them who to call.
   */
  holder?: string;
  /** The absent acts as lowercase verb phrases: `["approve pricing", "record a payment"]`. */
  acts?: string | string[];
  /** Replaces the composed first sentence outright. */
  title?: string;
  /** What the reader still has — "Everything on this screen stays readable." */
  message?: string;
  /** One forward action, and never a retry of the absent act: "Ask Priya to approve". */
  action?: ReactNode;
  /** `line` in an action row; `panel` (a flat `--neutral-bg` block) where it replaces a bar. */
  variant?: ScopeNoteVariant;
  align?: ScopeNoteAlign;
  /** 13 (default) or 12. Never below 12 — the type floor. */
  size?: number;
}

export interface ScopeNoteProps extends ScopeNoteSpec {}
