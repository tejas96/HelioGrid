/**
 * The number step's words (`SCR-M01-01` `m-normal` and its answers; frame 1 of `SCR-M01-02`), chosen
 * by the facts both doors hold: what the field refuses, what the primary is doing, whether the door
 * offers Google, and which block stands above the number — and the switch decision that stands in
 * the step's place while another person's work is held (`m-switch-discards`).
 */
import type { DoorNotice, PhoneDigitsMismatch, PhoneGoogle } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { SHELL } from './shell';
import { SIGN_IN } from './sign-in';
import { type DoorBlockWords, type PhoneGoogleWords, phoneGoogleWords } from './sign-in-google';

export interface NumberStepFacts {
  readonly notice: DoorNotice | null;
  /** `null` on a door with no Google sheet: it draws no Google part. */
  readonly google: PhoneGoogle | null;
  readonly problem: PhoneDigitsMismatch | null;
  readonly sending: boolean;
}

export interface NumberStepWords {
  /** Above the number, in reading order: a Google sign-in that did not finish, then the door's notice. */
  readonly blocks: readonly DoorBlockWords[];
  readonly phoneLabel: string;
  readonly phoneError: string | undefined;
  readonly primary: string;
  readonly google: Omit<PhoneGoogleWords, 'failed'> | null;
}

export function numberStepWords(
  translate: Translator['t'],
  { notice, google, problem, sending }: NumberStepFacts,
): NumberStepWords {
  const googleWords = google === null ? null : phoneGoogleWords(translate, google);
  const failed = googleWords?.failed ?? null;
  const blocks: DoorBlockWords[] = [];
  // A Google sign-in that did not finish answers a press, so it says itself at once.
  if (failed !== null) blocks.push({ ...failed, announce: 'alert' });
  if (notice !== null) blocks.push(doorNoticeWords(translate, notice));
  return {
    blocks,
    phoneLabel: translate(SIGN_IN.mobileNumber),
    phoneError:
      problem === null
        ? undefined
        : translate(SIGN_IN.digitsMismatch, { typed: problem.typed, needed: problem.needed }),
    primary: translate(sending ? SIGN_IN.sendingTheCode : SIGN_IN.sendCode),
    google:
      googleWords === null
        ? null
        : { or: googleWords.or, label: googleWords.label, aria: googleWords.aria },
  };
}

/** The block above the number step's field (`SCR-M01-01` `m-not-reached`): what failed, then why. */
export function doorNoticeWords(translate: Translator['t'], notice: DoorNotice): DoorBlockWords {
  switch (notice) {
    case 'access-removed':
      // The door knows no company: a removal reaches it only through the boot check (`S1.wrong.4`).
      return { tone: 'info', title: translate(SHELL.accessRemoved), announce: 'status' };
    case 'not-reached':
      return {
        tone: 'danger',
        title: translate(SIGN_IN.requestFailedTitle),
        body: translate(SIGN_IN.notReached),
        announce: 'alert',
      };
  }
}

/** What the switch would lose: who is signing in, how many photographs are held, and their date as the reader's market writes it. */
export interface DoorSwitchFacts {
  readonly name: string;
  readonly count: number;
  readonly date: string;
}

export interface DoorSwitchWords {
  readonly title: string;
  readonly subtitle: string;
  readonly upload: string;
  /** Why the upload road cannot be taken yet. */
  readonly uploadReason: string;
  readonly confirm: string;
  /** The sheet's close label; the sheet cannot be dismissed, and a screen reader still names it. */
  readonly close: string;
}

/** The switch decision's words (`F4-37`): the loss is named before the roads, upload first. */
export function doorSwitchWords(
  translate: Translator['t'],
  { name, count, date }: DoorSwitchFacts,
): DoorSwitchWords {
  return {
    title: translate(SIGN_IN.switchTitle, { name, count }),
    subtitle: translate(SIGN_IN.switchSubtitle, { date }),
    upload: translate(SIGN_IN.uploadFirst),
    uploadReason: translate(SIGN_IN.uploadArrivesLater),
    confirm: translate(SIGN_IN.signInAndDiscard),
    close: translate(SHELL.close),
  };
}
