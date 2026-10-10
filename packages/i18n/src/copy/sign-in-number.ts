/**
 * The number step's words (`SCR-M01-01` `m-normal` and its answers; frame 1 of `SCR-M01-02`), chosen
 * by the facts both doors hold: what the field refuses, what the primary is doing, whether the door
 * offers Google, and which block stands above the number.
 */
import type { DoorNotice, PhoneDigitsMismatch, PhoneGoogle } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { SIGN_IN } from './sign-in';
import { doorNoticeWords } from './sign-in-frames';
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
