import type { DedupeChoice } from '@heliogrid/domain';
import { colors, type ThemeColor } from '../../primitives/Color/colors';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { PendingActionSpec } from '../PendingAction/PendingAction.types';
import type {
  DedupeChoiceProps,
  DedupeKeepBothProps,
  DedupeSheetAct,
  DedupeSheetProps,
  DedupeSheetRecord,
  DedupeSheetWords,
} from './DedupeSheet.types';

/**
 * The sheet fires over a capture that is itself an editor — a sheet, or a side panel on the layer
 * every editor takes — so it stands one layer above it, as a chained picker does.
 */
export const DEDUPE_LAYER = 50;

/** An act is out and unanswered: every choice and every way out waits for it. */
export function isActWaiting(act: DedupeSheetAct | null): boolean {
  return act?.state === 'waiting';
}

/** The line under `choice`: its wait, or the sentence its failure came back with — else none. */
export function actLineOf(
  choice: DedupeChoice,
  act: DedupeSheetAct | null,
  words: Pick<DedupeSheetWords, 'waiting'>,
): PendingActionSpec | null {
  if (act === null || act.choice !== choice) return null;
  if (act.state === 'waiting') return { label: words.waiting[choice] };
  return { state: 'returned', reason: act.reason };
}

/** The reason as it is sent: trimmed, and absent while nothing but space is typed. */
export function keptReasonOf(typed: string): string | null {
  const reason = typed.trim();
  return reason === '' ? null : reason;
}

/** A press that sends nothing while an act waits — a second press is never a second request. */
export function unlessWaiting(act: DedupeSheetAct | null, send: () => void): () => void {
  return () => {
    if (!isActWaiting(act)) send();
  };
}

/** How each choice is marked: its glyph and the tone its circle and glyph take. */
export interface DedupeChoiceLook {
  readonly glyph: ShellGlyphName;
  readonly tone: 'accent' | 'info' | 'secondary';
  readonly circle: ThemeColor;
}

/** *Open existing* is the way forward, *Log enquiry* a note on it, *Keep both* the quiet exception. */
export function choiceLookOf(choice: DedupeChoice, record: DedupeSheetRecord): DedupeChoiceLook {
  if (choice === 'open_existing') {
    const glyph = record.kind === 'visible' ? 'arrow-up-right' : 'send';
    return { glyph, tone: 'accent', circle: colors.accent };
  }
  if (choice === 'log_enquiry') return { glyph: 'note', tone: 'info', circle: colors.info };
  return { glyph: 'pair', tone: 'secondary', circle: colors['text-secondary'] };
}

/** The choices the sheet offers, in order: *Keep both* only to someone who may keep both. */
export function choicesOf(
  props: Pick<
    DedupeSheetProps,
    'canKeepBoth' | 'act' | 'onOpenExisting' | 'onLogEnquiry' | 'words'
  >,
  keepBoth: { readonly shown: boolean; readonly toggle: () => void },
): Pick<DedupeChoiceProps, 'choice' | 'choiceWords' | 'onPress' | 'expanded'>[] {
  const { act, words } = props;
  return [
    {
      choice: 'open_existing',
      choiceWords: words.openExisting,
      onPress: unlessWaiting(act, props.onOpenExisting),
    },
    {
      choice: 'log_enquiry',
      choiceWords: words.logEnquiry,
      onPress: unlessWaiting(act, props.onLogEnquiry),
    },
    ...(props.canKeepBoth
      ? [
          {
            choice: 'keep_both' as const,
            choiceWords: words.keepBoth,
            onPress: unlessWaiting(act, keepBoth.toggle),
            expanded: keepBoth.shown,
          },
        ]
      : []),
  ];
}

/** *Keep both*'s confirm: asleep until a reason is typed, and sending nothing while an act waits. */
export function keepBothConfirmOf({ reason, act, onConfirm }: DedupeKeepBothProps) {
  const kept = keptReasonOf(reason);
  return {
    disabled: kept === null,
    onClick: () => {
      if (kept !== null && !isActWaiting(act)) onConfirm(kept);
    },
  };
}
