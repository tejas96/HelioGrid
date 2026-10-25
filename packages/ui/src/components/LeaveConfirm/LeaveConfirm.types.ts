/**
 * LeaveConfirm — *Leave without saving?* (`SCR-M01-18` s18-w, `SCR-M01-19` m19-n10): the ask a
 * settings page raises when the person moves away holding an unsaved change. The move waits on an
 * answer — no close and no dismissal, or a stray click outside would leave the change neither kept
 * nor dropped. Every word comes from the page that asks, already in the reader's language (`D2`).
 */
export interface LeaveConfirmProps {
  open: boolean;
  /** The question, from `packages/i18n`. */
  title: string;
  /** What is lost by leaving, from `packages/i18n`. */
  body: string;
  /** The destructive answer that drops the change and leaves. */
  discard: string;
  /** The answer that stays on the page with the change held. */
  keep: string;
  onKeep: () => void;
  onLeave: () => void;
}
