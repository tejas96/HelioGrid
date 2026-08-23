/* ReorderList's control button (web).

   `disabled` here means ARIA-disabled, NEVER the native attribute. The end arrows are the buttons
   with something to say ("is already first"), and a natively disabled button fires no click — so
   the branch that says it would be reachable by nothing, and the live region would never speak.
   Round 14C's ActionReason ruling, for the same reason: the control that cannot act is exactly the
   control that has something to say. It stays focusable, it moves nothing, and it says why. The
   primitive can now say exactly that — `accessibilityState.disabled` set ALONE announces off
   without the native attribute — so `disabled` is no longer what keeps this off the primitive.

   WHAT DOES: THE REF. `ReorderList` moves focus onto a named control after every move and every
   delete (ReorderList.focus.ts), so it must hold the real `HTMLButtonElement` to call `.focus()`
   on it and to read its `aria-disabled` — and the `Pressable` primitive forwards no ref. This is
   the same family as `LanguagePill`, `OptionCard` and `MenuItemRow`, every one of which stays a
   raw <button> for a ref, a roving `tabIndex` or a key handler the primitive does not take. The
   44×44 floor is kept in ReorderList.css instead. */

import type { Ref } from 'react';
import type { ReorderGlyph } from './ReorderList.defaults';
import { REORDER_GLYPHS } from './ReorderList.defaults';

export function ReorderControl({
  kind,
  label,
  disabled,
  onClick,
  tone = 'neutral',
  buttonRef,
}: {
  kind: ReorderGlyph;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  tone?: 'neutral' | 'danger';
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="hg-reorder-control"
      data-tone={tone}
      aria-label={label}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={onClick}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={REORDER_GLYPHS[kind]} />
      </svg>
    </button>
  );
}
