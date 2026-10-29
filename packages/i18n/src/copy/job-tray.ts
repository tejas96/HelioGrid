/**
 * `JobTray`'s own words (`packages/ui`'s `JobTray`): the tray's name, its clear act, and the one
 * line its trigger says about the work inside — in three languages (`F3-07`).
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';

export const JOB_TRAY = {
  label: /*i18n*/ { id: 'Background work' },
  clear: /*i18n*/ { id: 'Clear finished' },
  trigger: /*i18n*/ { id: '{label}, {summary}' },
  running: /*i18n*/ { id: '{count, plural, one {# running} other {# running}}' },
  failed: /*i18n*/ { id: '{count, plural, one {# failed} other {# failed}}' },
  finished: /*i18n*/ { id: '{count, plural, one {# finished} other {# finished}}' },
} as const;

/** The tray's name, its clear act's name, and the trigger's words, named as `JobTray` takes them. */
export function jobTrayWords(t: Translator['t']) {
  return {
    label: t(JOB_TRAY.label),
    clearLabel: t(JOB_TRAY.clear),
    words: {
      trigger: (label: TranslatedText, summary: string) => t(JOB_TRAY.trigger, { label, summary }),
      running: (count: number) => t(JOB_TRAY.running, { count }),
      failed: (count: number) => t(JOB_TRAY.failed, { count }),
      finished: (count: number) => t(JOB_TRAY.finished, { count }),
    },
  };
}
