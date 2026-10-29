import type { TranslatedText } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { Finding, FindingListWords, FindingStatus } from './FindingList.types';

/** The glyph each status draws, the same on both halves. */
export const FINDING_MARK_GLYPH: Record<FindingStatus, ShellGlyphName> = {
  ready: 'tick',
  blocking: 'alert-long',
  attention: 'alert-mid',
};

/** The finding's own jump wins; otherwise the list's jump, aimed at this finding; otherwise none. */
export function findingJump(
  finding: Finding,
  onJump: ((finding: Finding) => void) | undefined,
): (() => void) | undefined {
  return finding.onJump ?? (onJump === undefined ? undefined : () => onJump(finding));
}

/** The status chip's words: the finding's own, or its status's. */
export function findingStatusLabel(
  finding: Finding,
  status: FindingStatus,
  words: FindingListWords,
): TranslatedText {
  return finding.statusLabel ?? words.status[status];
}
