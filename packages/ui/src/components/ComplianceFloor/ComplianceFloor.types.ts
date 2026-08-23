import type { ReactNode } from 'react';

/**
 * **"Nobody can do this, ever, because the law says so."** The third class of *"this act is not
 * available"*, and a third answer because the act is in a third condition.
 *
 * - `ActionReason` — the **precondition**: the control stays, off, and names something the reader
 *   can go and do. The reason expires.
 * - `ScopeNote` — the **permission**: the act is absent and the screen names *whose* it is.
 * - `ComplianceFloor` — **neither.** There is nothing to go and do, and nobody holds the act: not
 *   the owner, not HelioGrid. Rendering either of the other two would tell the owner *"not yet"* or
 *   *"not yours"* where the truth is *"not ever, and here is the floor"*.
 *
 * The two rows it exists for: `M07-11` (P0) / `SCR-M07-05` — *"none forced — except 'asks to stop',
 * which is the statutory opt-out and cannot be removed"*, with `floor-blocked-save`: *"deleting
 * 'asks to stop' refuses the save with the floor named"* — and `M07-12`, *"narrower windows and
 * extra holidays only, never wider"*.
 *
 * **The wording, always in this order:** what cannot happen, flatly (*"Required by law — cannot be
 * removed"*), then **which floor, named** (*"Statutory opt-out · India · DoT
 * commercial-communications rules"*). *"Not allowed"* cannot be planned around.
 *
 * **Two variants, one sentence, split by when the reader meets it.** `line` is **persistent**, on
 * the row or date it is about, and **neutral** — a floor is not a fault and is true before anyone
 * touches anything. `refusal` is `floor-blocked-save`: warning tint, the floor named, and the one
 * move that saves the rest of the work. Words take `--warning-text`, never the mark token.
 */
export interface ComplianceFloorSpec {
  /** The floor's own name — "Statutory opt-out", "Market calling window". Named, never "policy". */
  floor?: string;
  /** Where it comes from — "India · DoT commercial-communications rules", "IN market pack · `F1-48`". */
  authority?: string;
  /** What the row or date is, for the refusal's first sentence — "Asks to stop", "Diwali". */
  subject?: string;
  /** The act as a past participle: `removed` (default), `widened`, `switched off`, `shortened`. */
  act?: string;
  /** Replaces the composed first sentence outright. */
  title?: string;
  /** A second sentence. In `refusal`, name the one move that saves the rest of the work. */
  message?: string;
  /** `line` — permanent, on the row it is about. `refusal` — the save that did not happen. */
  variant?: 'line' | 'refusal';
  /** One forward act. Never a retry of the refused act. */
  action?: ReactNode;
  /** 12 (default) or 13 in `line`. Never below 12 — the type floor. */
  size?: number;
}

export type ComplianceFloorProps = ComplianceFloorSpec;
