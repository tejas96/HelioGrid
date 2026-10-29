import type { ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';
import type { PendingActionProps, PendingActionSpec } from './PendingAction.types';

/** What one pending line shows, and at what size — `null` when it has no words to say. */
export interface PendingLine {
  returned: boolean;
  /** The act's name while waiting, the reason once it was returned. */
  words: ReactNode;
  /** The type floor is 12px. */
  fontSize: number;
  glyphSize: number;
  /** The rail sits on the words' first line. */
  railOffset: number;
  /** The slow note is said only while waiting. */
  showsSlowNote: boolean;
  /** A returned act offers its retry or its dismissal when it has either. */
  offersActs: boolean;
}

export function pendingLine({
  label,
  state = 'waiting',
  reason,
  slowNote,
  onRetry,
  retryLabel,
  onDismiss,
  size = 12,
}: PendingActionProps): PendingLine | null {
  const returned = state === 'returned';
  const words = returned ? reason : label;
  if (words === undefined || words === null || words === false || words === '') {
    return null;
  }
  const retrying = onRetry !== undefined && retryLabel !== undefined;
  const fontSize = Math.max(12, size);
  return {
    returned,
    words,
    fontSize,
    glyphSize: fontSize + 1,
    railOffset: Math.round(fontSize * 0.62),
    showsSlowNote: !returned && slowNote !== undefined,
    offersActs: returned && (retrying || onDismiss !== undefined),
  };
}

/** A plain spec object, as opposed to any of the object shapes ReactNode itself allows. */
function isPendingSpec(value: PendingActionSpec | ReactNode): value is PendingActionSpec {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isValidElement(value) &&
    !(Symbol.iterator in value) &&
    !('then' in value)
  );
}

/**
 * What a host's `pending` prop holds: a ready node to pass through, a spec to draw (a string is
 * its label), or nothing — a spec with neither a label nor a reason says nothing.
 */
export function readPendingInput(
  spec: PendingActionSpec | ReactNode,
): { node: ReactElement } | { spec: PendingActionSpec } | null {
  if (spec === undefined || spec === null || spec === false || spec === '') {
    return null;
  }
  if (isValidElement(spec)) {
    return { node: spec };
  }
  if (typeof spec === 'string') {
    return { spec: { label: spec } };
  }
  if (!isPendingSpec(spec)) {
    return null;
  }
  if (spec.label === undefined && spec.reason === undefined) {
    return null;
  }
  return { spec };
}
