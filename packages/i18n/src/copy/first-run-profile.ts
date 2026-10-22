/**
 * The words of First-Run Profile (`SCR-M01-09`, `M01-14`), for the frame domain's
 * `firstRunProfileFrame` decides — authored once for both platforms (Law 11). The heading and the
 * three reasons never change by state (brief decisions 10, 14); the inviter is named, never given a
 * pronoun (ruling 15). A refused photo reads the company logo's own limit lines.
 */

import type { ExplainerPagerWords } from '@heliogrid/domain';
import {
  FILE_SUBJECT_RULES,
  type FirstRunProfileFrame,
  firstNameOf,
  megabytesShown,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { REFUSED_FOR } from './company-logo';
import { explainerPagerWords } from './explainer';

export const FIRST_RUN_PROFILE = {
  heading: /*i18n*/ { id: 'How your team sees you' },
  aboutLabel: /*i18n*/ { id: 'About your name and photo' },
  aboutTitle: /*i18n*/ { id: 'Your name and photo' },
  reasonName: /*i18n*/ { id: '{company} sees this name beside everything you do.' },
  /** The phone's page: a shared job is where a face matters (`Mobile.dc.html`). */
  reasonPhotoPhone: /*i18n*/ { id: 'A photo helps teammates recognise you on a shared job.' },
  reasonPhoto: /*i18n*/ { id: 'A photo helps teammates recognise you.' },
  reasonLater: /*i18n*/ { id: 'You can change both later in Profile & preferences.' },
  nameLabel: /*i18n*/ { id: 'Your name' },
  nameLoading: /*i18n*/ { id: 'Loading your name' },
  nameArriving: /*i18n*/ { id: 'Your name is still arriving.' },
  nameFromInvite: /*i18n*/ { id: '{first} typed this when inviting you — change it if you like.' },
  nameEmptied: /*i18n*/ { id: '{first} had typed {name}; type the name your team should use.' },
  nameEmpty: /*i18n*/ { id: 'Your name is empty — type the name your team should call you.' },
  nameSaved: /*i18n*/ { id: 'Saved. Your team sees this name now.' },
  photoLabel: /*i18n*/ { id: 'Profile photo, optional' },
  photoAdd: /*i18n*/ { id: 'Add a photo' },
  photoChoose: /*i18n*/ { id: 'Choose a photo' },
  photoRetry: /*i18n*/ { id: 'Try the photo again' },
  photoReplace: /*i18n*/ { id: 'Replace' },
  photoRemove: /*i18n*/ { id: 'Remove' },
  photoOptional: /*i18n*/ { id: 'Optional — without one, your initials show.' },
  photoOptionalNameless: /*i18n*/ { id: 'Optional — your initials show once you type a name.' },
  photoHeld: /*i18n*/ { id: 'Remove it and your initials come back.' },
  photoFailed: /*i18n*/ { id: 'That photo did not upload' },
  photoFailedPhone: /*i18n*/ { id: 'You can add one later in Profile & preferences.' },
  photoFailedWide: /*i18n*/ { id: 'Try again, or add one later.' },
  photoRefused: /*i18n*/ { id: 'That photo cannot be used' },
  save: /*i18n*/ { id: 'Save and continue' },
  continueWithout: /*i18n*/ { id: 'Continue without a photo' },
  saveFailed: /*i18n*/ { id: 'Your profile did not save' },
  saveFailedLine: /*i18n*/ { id: 'Nothing was lost — press Save and continue to try again.' },
};

/** What the words are about: who invited the person, the name they typed, the company. */
export interface FirstRunProfileFacts {
  readonly inviterName: string;
  readonly invitedName: string;
  readonly companyName: string;
}

/** Every word the screen draws for one frame; `null` where the frame has no such part. */
export interface FirstRunProfileWords {
  readonly heading: string;
  readonly about: {
    readonly label: string;
    readonly title: string;
    /** The phone's three pages. */
    readonly pages: readonly [string, string, string];
  } & ExplainerPagerWords;
  /** The three lines of the 1536 brand pane. */
  readonly reasons: readonly [string, string, string];
  readonly name: {
    readonly label: string;
    readonly loading: string;
    readonly helper: string;
    readonly error: string | null;
    readonly success: string | null;
  };
  readonly photo: {
    readonly label: string;
    /** The act on the phone, then at 1536: a photo is taken there, chosen here (ruling 11). */
    readonly choosePhone: string;
    readonly chooseWide: string;
    readonly replace: string;
    readonly remove: string;
    readonly helper: string;
    /** The refusal banner, with the line the phone and 1536 each draw under its title. */
    readonly error: {
      readonly title: string;
      readonly phone: string;
      readonly wide: string;
    } | null;
  };
  readonly act: string;
  readonly actReason: string | null;
  readonly saveFailed: { readonly title: string; readonly line: string } | null;
}

const MAX_MEGABYTES = megabytesShown(FILE_SUBJECT_RULES.user_account.maxBytes);

function photoErrorOf(
  t: Translator['t'],
  frame: FirstRunProfileFrame,
): FirstRunProfileWords['photo']['error'] {
  const { photo } = frame;
  if (frame.kind === 'error-photo') {
    const title = t(FIRST_RUN_PROFILE.photoFailed);
    return {
      title,
      phone: t(FIRST_RUN_PROFILE.photoFailedPhone),
      wide: t(FIRST_RUN_PROFILE.photoFailedWide),
    };
  }
  if (photo.kind !== 'refused') return null;
  const line = t(REFUSED_FOR[photo.missed], {
    megabytes: photo.megabytes,
    maxMegabytes: MAX_MEGABYTES,
  });
  return { title: t(FIRST_RUN_PROFILE.photoRefused), phone: line, wide: line };
}

function photoHelperOf(t: Translator['t'], frame: FirstRunProfileFrame, named: boolean): string {
  if (frame.photo.kind === 'chosen') return t(FIRST_RUN_PROFILE.photoHeld);
  return t(named ? FIRST_RUN_PROFILE.photoOptional : FIRST_RUN_PROFILE.photoOptionalNameless);
}

export function firstRunProfileWords(
  t: Translator['t'],
  frame: FirstRunProfileFrame,
  facts: FirstRunProfileFacts,
): FirstRunProfileWords {
  const first = firstNameOf(facts.inviterName);
  const company = { company: facts.companyName };
  const emptied = frame.kind === 'empty' || frame.kind === 'empty-pressed';
  const retry = frame.photoAct === 'retry';
  return {
    heading: t(FIRST_RUN_PROFILE.heading),
    about: {
      ...explainerPagerWords(t),
      label: t(FIRST_RUN_PROFILE.aboutLabel),
      title: t(FIRST_RUN_PROFILE.aboutTitle),
      pages: [
        t(FIRST_RUN_PROFILE.reasonName, company),
        t(FIRST_RUN_PROFILE.reasonPhotoPhone),
        t(FIRST_RUN_PROFILE.reasonLater),
      ],
    },
    reasons: [
      t(FIRST_RUN_PROFILE.reasonName, company),
      t(FIRST_RUN_PROFILE.reasonPhoto),
      t(FIRST_RUN_PROFILE.reasonLater),
    ],
    name: {
      label: t(FIRST_RUN_PROFILE.nameLabel),
      loading: t(FIRST_RUN_PROFILE.nameLoading),
      helper: emptied
        ? t(FIRST_RUN_PROFILE.nameEmptied, { first, name: facts.invitedName })
        : t(FIRST_RUN_PROFILE.nameFromInvite, { first }),
      error: frame.kind === 'empty-pressed' ? t(FIRST_RUN_PROFILE.nameEmpty) : null,
      success: frame.kind === 'error-photo' ? t(FIRST_RUN_PROFILE.nameSaved) : null,
    },
    photo: {
      label: t(FIRST_RUN_PROFILE.photoLabel),
      choosePhone: t(retry ? FIRST_RUN_PROFILE.photoRetry : FIRST_RUN_PROFILE.photoAdd),
      chooseWide: t(retry ? FIRST_RUN_PROFILE.photoRetry : FIRST_RUN_PROFILE.photoChoose),
      replace: t(retry ? FIRST_RUN_PROFILE.photoRetry : FIRST_RUN_PROFILE.photoReplace),
      remove: t(FIRST_RUN_PROFILE.photoRemove),
      helper: photoHelperOf(t, frame, !emptied),
      error: photoErrorOf(t, frame),
    },
    act: t(frame.act === 'continue' ? FIRST_RUN_PROFILE.continueWithout : FIRST_RUN_PROFILE.save),
    actReason: frame.kind === 'loading' ? t(FIRST_RUN_PROFILE.nameArriving) : null,
    saveFailed:
      frame.kind === 'error-save'
        ? { title: t(FIRST_RUN_PROFILE.saveFailed), line: t(FIRST_RUN_PROFILE.saveFailedLine) }
        : null,
  };
}
