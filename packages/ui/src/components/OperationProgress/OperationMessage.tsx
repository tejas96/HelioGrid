import type { ReactNode } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { OperationState } from './OperationProgress.types';
import { messageGlyph } from './operation-progress-model';

function MessageGlyph({ state }: { state: OperationState }) {
  return <ShellGlyph name={messageGlyph(state)} size="dense" tone="current" />;
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
