import { installStepLabel } from './install-steps';
import { type PackLabel, packLabel, type UiLanguage } from './languages';
import type { FormatPack } from './pack';
import { blockerPartyLabel, blockerReasonLabel, stageLabel } from './vocabulary';

/**
 * The market words a project screen shows (`F1-22`): a stage, a waited-on party, a wait's reason,
 * a checklist row and an install step — each the pack's label in the reader's language, or `null`
 * where the pack declares none (`F1-09`). One reader, so no surface looks a label up by itself.
 */
export const PACK_WORD_KINDS = ['stage', 'party', 'reason', 'row', 'step'] as const;
export type PackWordKind = (typeof PACK_WORD_KINDS)[number];

const LABEL_OF: Readonly<
  Record<PackWordKind, (pack: FormatPack, key: string) => PackLabel | null>
> = {
  stage: (pack, key) => stageLabel(pack.vocabulary, key),
  party: (pack, key) => blockerPartyLabel(pack.vocabulary, key),
  reason: (pack, key) => blockerReasonLabel(pack.vocabulary, key),
  row: (pack, key) => pack.documentChecklist.find((row) => row.row === key)?.label ?? null,
  step: (pack, key) => installStepLabel(pack.installSteps, key),
};

export function packWordOf(
  pack: FormatPack,
  kind: PackWordKind,
  key: string,
  language: UiLanguage,
): string | null {
  const label = LABEL_OF[kind](pack, key);
  return label === null ? null : packLabel(label, language);
}
