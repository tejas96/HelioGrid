import type { TranslatedText } from '@heliogrid/contracts';
import type { SetupStep, SetupStepState } from '@heliogrid/domain';
import { SETTINGS_ROW_GLYPH } from '../SettingsList/SettingsList.logic';
import type { ReadinessStep } from './ProposalReadiness.types';

/**
 * The steps as the hero draws them: each step's settings-row glyph, its words, and the press that
 * opens its page — the one mapping both Home screens share; each passes its own way to the page.
 */
export function readinessSteps(
  states: readonly SetupStepState[],
  wordsOf: (step: SetupStep) => { readonly label: TranslatedText; readonly detail: TranslatedText },
  open: (step: SetupStep) => void,
): ReadinessStep[] {
  return states.map(({ step, done }) => ({
    key: step,
    ...wordsOf(step),
    done,
    icon: SETTINGS_ROW_GLYPH[step],
    onOpen: () => open(step),
  }));
}
