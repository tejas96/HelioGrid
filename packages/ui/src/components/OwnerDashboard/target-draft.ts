import type { TranslatedText } from '@heliogrid/contracts';
import { AMOUNT_WHOLE_DIGITS_MAX, minorUnitsOfDecimal } from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';
import { type FocusAfter, landFocusOn } from '../../primitives/FocusAfter';
import { useFormat } from '../MarketProvider';
import type { OwnerDashboardWords } from './OwnerDashboard.types';

/** What the inline target editor takes, on both halves. */
export interface TargetEditorProps {
  readonly words: OwnerDashboardWords;
  /** The target set now, as its decimal; `null` when none is. */
  readonly initial: string | null;
  readonly saving: boolean;
  readonly failed: boolean;
  /** The decimal typed, or `null` to clear the target. */
  readonly onSave: (amount: string | null) => void;
  readonly onCancel: () => void;
}

/** A typed decimal as the field's figure; `''` is unset, never `0`. */
export function figureOfDraft(draft: string): number | undefined {
  return draft === '' ? undefined : Number(draft);
}

/** Why a typed target cannot be sent, or `null` when it can. */
export type TargetRefusal =
  | { readonly kind: 'not-positive' }
  | { readonly kind: 'too-large' }
  | { readonly kind: 'too-fine'; readonly digits: number };

/**
 * A typed target checked on the device before it is sent: more than zero, under the wire's
 * whole-digit bound, and no finer than the currency's minor unit (INR: two places).
 */
export function targetRefusalOf(draft: string, minorUnitDigits: number): TargetRefusal | null {
  const figure = Number(draft);
  if (!(figure > 0)) return { kind: 'not-positive' };
  if (figure >= 10 ** AMOUNT_WHOLE_DIGITS_MAX) return { kind: 'too-large' };
  try {
    minorUnitsOfDecimal(draft, minorUnitDigits);
    return null;
  } catch {
    return { kind: 'too-fine', digits: minorUnitDigits };
  }
}

function refusalWords(refusal: TargetRefusal, words: OwnerDashboardWords): TranslatedText {
  switch (refusal.kind) {
    case 'not-positive':
      return words.targetNotPositive;
    case 'too-large':
      return words.targetTooLarge;
    case 'too-fine':
      return words.targetTooFine(refusal.digits);
  }
}

/**
 * The editor's draft on both halves: the decimal as typed; a refusal said on the field when *Save*
 * finds the amount cannot be sent, focus moved into the field so it is heard; a server's failure
 * shown until the person types again. Typing clears both.
 */
export function useTargetDraft(props: TargetEditorProps) {
  const format = useFormat();
  const [draft, setDraft] = useState(props.initial ?? '');
  const [refusal, setRefusal] = useState<TargetRefusal | null>(null);
  const [focusRequest, setFocusRequest] = useState(1);
  const [retyped, setRetyped] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: each new failure is shown again
  useEffect(() => setRetyped(false), [props.failed]);
  const typed = (next: string) => {
    setDraft(next);
    setRefusal(null);
    setRetyped(true);
  };
  return {
    draft,
    error: refusal === null ? undefined : refusalWords(refusal, props.words),
    failed: props.failed && !retyped,
    focusRequest,
    onCommit: (value: number) => typed(String(value)),
    onClear: () => typed(''),
    save: () => {
      const found = targetRefusalOf(draft, format.pack.minorUnitDigits);
      if (found === null) return props.onSave(draft);
      setRefusal(found);
      setFocusRequest((request) => request + 1);
    },
  };
}

/** Whether the target editor is open, and how it opens and closes. */
export type TargetEditing = ReturnType<typeof useTargetEditing>;

/**
 * Whether the editor is open: it opens on *Set a target* or the pencil, and closes on *Cancel* or
 * once a save it sent comes back without failing — focus then lands on the card's figure. Held by
 * the dashboard, since the open editor takes the won card's whole row.
 */
export function useTargetEditing(saving: boolean, failed: boolean, focusAfter: FocusAfter) {
  const [editing, setEditing] = useState(false);
  const wasSaving = useRef(saving);
  useEffect(() => {
    const finished = wasSaving.current && !saving;
    wasSaving.current = saving;
    if (finished && !failed && editing) {
      setEditing(false);
      landFocusOn(focusAfter);
    }
  }, [saving, failed, editing, focusAfter]);
  return { editing, open: () => setEditing(true), close: () => setEditing(false) };
}
