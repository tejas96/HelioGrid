'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { Button, type FocusAfter, ShellGlyph } from '@heliogrid/ui';
import { useEffect, useRef } from 'react';

/**
 * A sheet's send: it leaves with its sheet, and focus then lands on the page's `focusAfter` — the
 * note that says what the customer did. The sheet's own restore puts focus back on the act that
 * opened it, which still stands (an *Ask* relabelled after a decline), so `useFocusAfter`'s
 * lost-focus test would leave it there: a sent answer takes focus from that restore, one frame
 * after it. A send that failed keeps its sheet and its focus.
 */
export function SendAct({
  label,
  glyph,
  quiet,
  disabled,
  loading,
  onSend,
  focusAfter,
}: {
  label: TranslatedText;
  glyph?: 'check' | 'phone';
  quiet: boolean;
  disabled: boolean;
  loading: boolean;
  onSend: () => void;
  focusAfter: FocusAfter;
}) {
  const sent = useSentFocus(focusAfter);
  return (
    <Button
      variant={quiet ? 'secondary' : 'primary'}
      size="lg"
      fullWidth
      disabled={disabled}
      loading={loading}
      {...(glyph === undefined ? {} : { icon: <ShellGlyph name={glyph} /> })}
      onClick={() => {
        sent.current = true;
        onSend();
      }}
    >
      {label}
    </Button>
  );
}

function useSentFocus(focusAfter: FocusAfter) {
  const target = useRef(focusAfter);
  target.current = focusAfter;
  const sent = useRef(false);
  useEffect(
    () => () => {
      if (!sent.current) return;
      requestAnimationFrame(() => target.current.current?.focus({ preventScroll: true }));
    },
    [],
  );
  return sent;
}
