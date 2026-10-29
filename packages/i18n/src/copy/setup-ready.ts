import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The words of *You're ready*, setup's last screen (`SCR-M01-06`, `M01-26`): the heading, the
 * company read back, the two doors, and the wall when the company cannot be read — authored once for both platforms (Law 11).
 */
import type { Translator } from '../runtime';
import { SIGN_IN } from './sign-in';

export const SETUP_READY = {
  title: /*i18n*/ { id: 'You’re ready' },
  companyLine: /*i18n*/ { id: '{company} is set up.' },
  leadTitle: /*i18n*/ { id: 'Start with a real lead' },
  leadLine: /*i18n*/ { id: 'A name and a phone number is enough to begin.' },
  leadAct: /*i18n*/ { id: 'Create your first lead' },
  demoTitle: /*i18n*/ { id: 'See a finished job' },
  demoBadge: /*i18n*/ { id: 'Demo' },
  demoLine: /*i18n*/ { id: 'A worked rooftop project — survey, design and proposal, all done.' },
  demoAct: /*i18n*/ { id: 'Open the demo project' },
  demoLoading: /*i18n*/ { id: 'Getting the demo ready.' },
  demoFailed: /*i18n*/ { id: 'We couldn’t get the demo project ready' },
  wallTitle: /*i18n*/ { id: 'We couldn’t open your workspace' },
  wallLine: /*i18n*/ { id: 'Your company is set up.' },
};

export interface SetupReadyDoorWords {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  readonly act: TranslatedText;
}

export interface SetupReadyWords {
  readonly title: TranslatedText;
  /** The company read back (brief decision 9); the name is the tenant's own, never translated. */
  readonly companyLine: (company: string) => TranslatedText;
  readonly lead: SetupReadyDoorWords;
  readonly demo: SetupReadyDoorWords & {
    readonly badge: TranslatedText;
    readonly loading: TranslatedText;
    readonly failed: TranslatedText;
  };
  /** The company could not be read: the wall, and a line so a fetch failure never reads as a lost signup. */
  readonly wall: { readonly title: TranslatedText; readonly line: TranslatedText };
  readonly tryAgain: TranslatedText;
}

export function setupReadyWords(translate: Translator['t']): SetupReadyWords {
  return {
    title: translate(SETUP_READY.title),
    companyLine: (company) => translate(SETUP_READY.companyLine, { company }),
    lead: {
      title: translate(SETUP_READY.leadTitle),
      line: translate(SETUP_READY.leadLine),
      act: translate(SETUP_READY.leadAct),
    },
    demo: {
      title: translate(SETUP_READY.demoTitle),
      badge: translate(SETUP_READY.demoBadge),
      line: translate(SETUP_READY.demoLine),
      act: translate(SETUP_READY.demoAct),
      loading: translate(SETUP_READY.demoLoading),
      failed: translate(SETUP_READY.demoFailed),
    },
    wall: { title: translate(SETUP_READY.wallTitle), line: translate(SETUP_READY.wallLine) },
    tryAgain: translate(SIGN_IN.tryAgain),
  };
}
