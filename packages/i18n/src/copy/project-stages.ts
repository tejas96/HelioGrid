/**
 * What each stage of `M08-08`'s chain says beyond its label (`SCR-M01-20`, decision 1): a short
 * form for the stage picker, and the *when* sentence a payment schedule prints under a tranche.
 * The LABEL is the pack's (`F1-22`, `stageLabel`); these are the words the pack does not hold. A
 * `Record` over domain's chain, so a new stage fails to compile here. A sentence names no scheme:
 * a scheme's name comes from the pack.
 */
import type { ProjectChainStage } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';

const STAGE_WORDS: Record<
  ProjectChainStage,
  { readonly short: MessageRef; readonly when: MessageRef }
> = {
  won: {
    short: /*i18n*/ { id: 'Customer signs' },
    when: /*i18n*/ { id: 'When your customer signs and the order is confirmed' },
  },
  material_ordered: {
    short: /*i18n*/ { id: 'You order the material' },
    when: /*i18n*/ { id: 'When you place the order with your supplier' },
  },
  dispatched: {
    short: /*i18n*/ { id: 'Material leaves for site' },
    when: /*i18n*/ { id: 'When the modules and inverter leave for site' },
  },
  installation: {
    short: /*i18n*/ { id: 'Mounted and wired' },
    when: /*i18n*/ { id: 'When the plant is mounted and wired on the roof' },
  },
  electrical_metering: {
    short: /*i18n*/ { id: 'Meter fitted' },
    when: /*i18n*/ { id: 'When the meter for the plant is fitted' },
  },
  utility_inspection: {
    short: /*i18n*/ { id: 'Utility clears the plant' },
    when: /*i18n*/ { id: 'When the utility inspects and clears the plant' },
  },
  commissioned: {
    short: /*i18n*/ { id: 'Tested and generating' },
    when: /*i18n*/ { id: 'When the plant is tested and generating' },
  },
  incentive_claimed: {
    short: /*i18n*/ { id: 'Subsidy claim filed' },
    when: /*i18n*/ { id: 'When the incentive claim is filed and acknowledged' },
  },
  handed_over: {
    short: /*i18n*/ { id: 'Readings and papers handed over' },
    when: /*i18n*/ { id: 'When the readings and paperwork are handed over' },
  },
};

/** Each stage's short form and *when* sentence, in the reader's language. */
export function stageWords(
  t: Translator['t'],
): Record<ProjectChainStage, { readonly short: string; readonly when: string }> {
  const entries = Object.entries(STAGE_WORDS).map(([stage, words]) => [
    stage,
    { short: t(words.short), when: t(words.when) },
  ]);
  return Object.fromEntries(entries) as Record<
    ProjectChainStage,
    { readonly short: string; readonly when: string }
  >;
}
