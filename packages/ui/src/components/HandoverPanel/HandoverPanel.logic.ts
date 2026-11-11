import type { TranslatedText } from '@heliogrid/contracts';
import { checkableNumberOf, type FormatPack, type HandoverOpening } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { LoadingBarsProps } from '../LoadingBars/LoadingBars.types';
import type {
  HandoverMessageProps,
  HandoverPackState,
  HandoverProject,
  HandoverReferralDraft,
  HandoverWords,
} from './HandoverPanel.types';

/** The project has reached its last stage — the handover's own moment, and the referral's. */
export function isHandedOver(project: HandoverProject): boolean {
  return project.stage === 'handed_over';
}

/**
 * Why *Hand over* is off — the project is closed, has not reached the stage handover opens at, or a
 * row still waits — or null when it can be sent. A handover reached by its address alone is held
 * here, not refused after the press.
 */
export function handOverBlockedOf(
  words: HandoverWords,
  opening: HandoverOpening,
  pendingRows: readonly string[],
): TranslatedText | null {
  if (opening.kind === 'closed') return words.closed;
  if (opening.kind === 'not_yet') return words.notYet(opening.from);
  return pendingRows.length > 0 ? words.waitingLine : null;
}

/** Whose job it was, as the moment names it: the customer, else the project's number. */
export function handedOverNameOf(project: HandoverProject): string {
  return project.customer.name ?? project.number;
}

/** The pack's line: what it will hold, that it is being made, what it holds, or that it is late. */
export function packLineOf(words: HandoverWords, pack: HandoverPackState): TranslatedText {
  switch (pack.kind) {
    case 'empty':
      return words.packEmpty;
    case 'unmade':
      return words.packUnmade(pack.files);
    case 'making':
      return words.packMaking;
    case 'ready':
      return pack.leftOut > 0
        ? words.packMadeLeftOut(pack.files, pack.leftOut)
        : words.packMade(pack.files);
    case 'late':
      return words.packLate;
    case 'unreadable':
      return words.packUnreadable;
  }
}

/** The handover's preview on its way: the hero's panel and the rows under it. */
export function handoverLoadingOf(words: { readonly loading: TranslatedText }): LoadingBarsProps {
  return { bars: ['panel', 'row', 'row'], label: words.loading };
}

/** The checklist counted for the ready line: rows done, and rows not needed. */
export function documentCountsOf(project: HandoverProject): {
  readonly done: number;
  readonly notNeeded: number;
} {
  return {
    done: project.documents.filter((document) => document.state === 'done').length,
    notNeeded: project.documents.filter((document) => document.state === 'not_needed').length,
  };
}

/**
 * The referral as it is sent — a name, and the number as it is stored — or null while either is
 * missing or the number is not yet whole.
 */
export function referralOf(
  pack: FormatPack,
  name: string,
  phone: string,
): HandoverReferralDraft | null {
  const named = name.trim();
  const phoneE164 = checkableNumberOf(pack, phone);
  return named === '' || phoneE164 === null ? null : { name: named, phoneE164 };
}

/** One of the person's own ways to send the message. */
export interface HandoverMessageAct {
  readonly key: 'share' | 'copy';
  readonly glyph: ShellGlyphName;
  readonly label: TranslatedText;
  readonly onPress: () => void;
}

/** The ways the platform offers to send the message — the share sheet, then Copy. */
export function messageActsOf({
  words,
  message,
  onShare,
  onCopy,
}: HandoverMessageProps): HandoverMessageAct[] {
  const acts: HandoverMessageAct[] = [];
  if (onShare !== null) {
    acts.push({
      key: 'share',
      glyph: 'send',
      label: words.share,
      onPress: () => onShare(message.text),
    });
  }
  if (onCopy !== null) {
    acts.push({
      key: 'copy',
      glyph: 'clipboard',
      label: words.copy,
      onPress: () => onCopy(message.text),
    });
  }
  return acts;
}
