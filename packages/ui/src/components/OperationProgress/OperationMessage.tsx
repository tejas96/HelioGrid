import type { ReactNode } from 'react';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { OperationState } from './OperationProgress.types';
import { messageGlyph } from './operation-progress-model';

function MessageGlyph({ state }: { state: OperationState }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ShellGlyphMarks name={messageGlyph(state)} />
    </svg>
  );
}

/**
 * The finishing sentence: the report line, the failure, or what a cancel left behind. `failed`
 * takes `role="alert"` because it interrupts; everything else is a polite `status`.
 */
export function OperationMessage({
  state,
  message,
}: {
  state: OperationState;
  message: ReactNode;
}) {
  return (
    <p
      role={state === 'failed' ? 'alert' : 'status'}
      data-state={state}
      className="hg-operation-progress-message"
    >
      <span className="hg-operation-progress-message-mark" aria-hidden="true">
        <MessageGlyph state={state} />
      </span>
      <span className="hg-operation-progress-message-words">{message}</span>
    </p>
  );
}
