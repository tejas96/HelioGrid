import { QUALIFY_QUESTIONS } from '@heliogrid/domain';
import {
  type createTranslator,
  leadDetailPageWords,
  leadDockWords,
  leadSectionsWords,
  QUALIFY_QUESTION_LABEL,
  qualifyCardWords,
} from '@heliogrid/i18n';

/*
 * Lead Detail's words for its phone flow (`SCR-M02-04`, `mobile/lead-detail.yaml`), handed to Maestro
 * by `mobile-cli.ts`, which reads no file mid-flow.
 */

/**
 * Call and the four acts' words under the dock's round buttons, the folded qualify card's count —
 * the flow's fresh lead has none answered, and its overline's case differs on Android — the roof
 * question and one answer,
 * the mark an answer saved shows, the Timeline tab and the way back.
 */
export function leadDetailFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const dock = leadDockWords(t.t);
  const qualify = qualifyCardWords(t.t);
  return {
    CALL: dock.call,
    MESSAGE_SHORT: dock.message.short,
    LOG_SHORT: dock.log.short,
    VISIT_SHORT: dock.visit.short,
    DESIGN_SHORT: dock.design.short,
    QUALIFY_FOLDED: qualify.count(0, QUALIFY_QUESTIONS.length),
    ROOF: t.t(QUALIFY_QUESTION_LABEL.roofOwnership),
    ROOF_OWNED: qualify.choice('roofOwnership', 'own'),
    ANSWER_SAVED: qualify.saved,
    TIMELINE_TAB: leadSectionsWords(t.t).tabs.timeline,
    BACK_TO_LIST: leadDetailPageWords(t.t).backToList,
  };
}
