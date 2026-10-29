import type { TranslatedText } from '@heliogrid/contracts';
import type { NextActionTone } from './NextAction.types';

/**
 * How the task line is inked. `overdue` is the only red case, which is what keeps red meaningful;
 * a snoozed or muted task goes quiet rather than disappearing.
 */
export type NextActionInk = 'overdue' | 'quiet' | 'normal';

export function nextActionInk(tone: NextActionTone, muted: boolean): NextActionInk {
  return tone === 'overdue' ? 'overdue' : muted || tone === 'snoozed' ? 'quiet' : 'normal';
}

/** The task line: its label, and the caller's meta after a middot. */
export function nextActionLine(label: TranslatedText, meta: string | undefined): string {
  return `${label}${meta ? ` · ${meta}` : ''}`;
}
