import type { GoogleLinkFrame, LoginPress } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { ExplainerProps } from '../Explainer/Explainer.types';
import type { TintedBlockProps } from '../TintedBlock/TintedBlock.types';

/**
 * Every word the link step draws; `@heliogrid/i18n`'s `googleLinkWords` writes them. `null` where
 * the frame has no such part.
 */
export interface DoorLinkStepWords {
  title: string;
  body: string;
  /** The linking rule, beside the title on the open step; the locked step drops it. */
  explainer: ExplainerProps | null;
  tileOverline: string;
  /** The Google login being linked. */
  email: string;
  /** Under the door's breakpoint "Not you?" sits under the tile; from it the shorter link sits under Send code. */
  anotherAccount: { underTile: string; short: string };
  /** The way back to the number step, in the header row. */
  useNumber: { label: string; aria: string };
  phoneLabel: string;
  /** The field's own answer to a number of the wrong length; absent as the step opens. */
  phoneError: string | undefined;
  send: { label: string; aria: string } | null;
  /** The number is under its SMS lock: the block, and the sentence that says linking waits. */
  locked: { block: Pick<TintedBlockProps, 'tone' | 'title'>; sentence: string } | null;
}

/**
 * The link step a first Google sign-in lands on (`SCR-M01-01` `m-google-link`, `d-google-link`):
 * the number the Google login joins, proven by its code. A locked number keeps the step and loses
 * Send code (`m-google-link-locked`). The frame's structure is `domain`'s and its words `i18n`'s;
 * this draws them and raises the presses.
 */
export interface DoorLinkStepProps {
  /**
   * The door's language control. It is page chrome from the door's breakpoint only: under it, and
   * on the phone, the header row holds the way back alone (`SCR-M01-01` "375 vertical layout"), so
   * the native half reads none.
   */
  language: ReactNode;
  words: DoorLinkStepWords;
  /** What the frame draws: whether the number is locked, may be typed, and is being sent a code. */
  frame: Pick<GoogleLinkFrame, 'kind' | 'phoneEnabled' | 'sending'>;
  /** The number as typed, in E.164. */
  phone: string;
  onPhone: (phone: string) => void;
  /** A round trip is in flight: the way to another Google account waits. */
  busy: boolean;
  onPress: (control: Extract<LoginPress, 'use-number' | 'send' | 'google'>) => void;
}
