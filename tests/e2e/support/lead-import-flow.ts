import { type createTranslator, leadImportWords } from '@heliogrid/i18n';

/**
 * The Lead Import Wizard's words a phone flow reads (`SCR-M02-05`): its title, the first step's
 * picker and promise, the step track's first and second steps and the way back to the list.
 */
export function leadImportFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const words = leadImportWords(t.t);
  return {
    IMPORT_TITLE: words.title,
    IMPORT_CHOOSE: words.choose,
    IMPORT_UNTOUCHED: words.untouched,
    IMPORT_STEP_UPLOAD: words.steps[0],
    IMPORT_STEP_MAP: words.steps[1],
    IMPORT_BACK: words.backToLeads,
  };
}
