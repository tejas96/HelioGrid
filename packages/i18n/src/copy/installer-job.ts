/**
 * The installer's job (`SCR-M08-05`): today's job, how to get in, the steps with their photos —
 * and nothing commercial, ever (`M08-43`).
 */
import { firstNameOf } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { PROJECT_DETAIL } from './project-detail';
import type { PackWord } from './projects';
import { PROJECT_FAILED_MESSAGE } from './projects';
import { SHELL } from './shell';

type T = Translator['t'];

const JOB = {
  title: /*i18n*/ { id: 'Today’s job' },
  summary: /*i18n*/ { id: '{job} · {name}’s crew' },
  none: /*i18n*/ { id: 'No job today' },
  noneLine: /*i18n*/ { id: 'When a project is dispatched to you, it shows here.' },
  gettingIn: /*i18n*/ { id: 'Getting in' },
  directions: /*i18n*/ { id: 'Directions' },
  callSite: /*i18n*/ { id: 'Call the customer' },
  steps: /*i18n*/ { id: 'Install steps' },
  stepsCount: /*i18n*/ { id: '{ticked} of {total} · a photo each' },
  photoAndTick: /*i18n*/ { id: 'Photo and tick' },
  photoNotSent: /*i18n*/ { id: 'Photo not sent' },
  retryPhoto: /*i18n*/ { id: 'Retry' },
  photoAndTickStep: /*i18n*/ { id: 'Photo and tick: {step}' },
  photoStep: /*i18n*/ { id: 'Photo: {step}' },
  retryPhotoStep: /*i18n*/ { id: 'Retry the photo: {step}' },
  photosNeed: /*i18n*/ { id: 'Photos shrink before they upload. No prices on this screen.' },
  doneBy: /*i18n*/ { id: 'Done by someone else? Name them' },
  otherJobs: /*i18n*/ { id: 'Your other jobs' },
  crew: /*i18n*/ { id: 'Crew' },
  doneByWho: /*i18n*/ { id: 'Done by {name}' },
  photosTitle: /*i18n*/ { id: 'Photos we need' },
  loading: /*i18n*/ { id: 'Loading your job' },
  failedTitle: /*i18n*/ { id: 'Your job did not load' },
} satisfies Record<string, MessageRef>;

/** The installer's job words. */
export function installerJobWords(t: T, word: PackWord) {
  return {
    title: t(JOB.title),
    /** Whose job it is, and whose crew is on it — the first named; the job alone with none. */
    summary: (job: string, crew: string | null) =>
      crew === null ? shownAsSent(job) : t(JOB.summary, { job, name: firstNameOf(crew) }),
    none: t(JOB.none),
    noneLine: t(JOB.noneLine),
    gettingIn: t(JOB.gettingIn),
    directions: t(JOB.directions),
    callSite: t(JOB.callSite),
    /** The call, by the customer's first name where the job names them. */
    call: (name: string | null) =>
      name === null ? t(JOB.callSite) : t(PROJECT_DETAIL.call, { name: firstNameOf(name) }),
    steps: t(JOB.steps),
    stepsCount: (ticked: number, total: number) => t(JOB.stepsCount, { ticked, total }),
    photoAndTick: t(JOB.photoAndTick),
    photoNotSent: t(JOB.photoNotSent),
    retryPhoto: t(JOB.retryPhoto),
    /** A row act spoken with its step, so a list of rows never repeats the same words. */
    photoAndTickStep: (step: string) => t(JOB.photoAndTickStep, { step }),
    photoStep: (step: string) => t(JOB.photoStep, { step }),
    retryPhotoStep: (step: string) => t(JOB.retryPhotoStep, { step }),
    photosNeed: t(JOB.photosNeed),
    doneBy: t(JOB.doneBy),
    otherJobs: t(JOB.otherJobs),
    crew: t(JOB.crew),
    count: (done: number, total: number) => t(SHELL.markCount, { step: done, total }),
    photo: t(PROJECT_DETAIL.photo),
    tickedBy: (name: string, time: string) => t(PROJECT_DETAIL.tickedBy, { name, time }),
    noAccessNote: t(PROJECT_DETAIL.noAccessNote),
    notSent: t(PROJECT_DETAIL.notSent),
    doneByWho: (name: string) => t(JOB.doneByWho, { name }),
    photosTitle: t(JOB.photosTitle),
    step: (step: string) => word('step', step),
    stage: (stage: string) => word('stage', stage),
    loading: t(JOB.loading),
    failedTitle: t(JOB.failedTitle),
    failedMessage: t(PROJECT_FAILED_MESSAGE),
    retry: t(SHELL.tryAgain),
  };
}
export type InstallerJobCopy = ReturnType<typeof installerJobWords>;
