import type { LoginFrame, LoginPress } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { DoorTaskMeasure } from '../DoorFrame/DoorFrame.types';
import type { ExplainerProps } from '../Explainer/Explainer.types';
import type { TintedBlockProps } from '../TintedBlock/TintedBlock.types';

/**
 * Every word a code frame draws; `@heliogrid/i18n`'s `signInWords` writes them. `null` where the
 * frame has no such part.
 */
export interface DoorCodeStepWords {
  /** The way back to the number step, in the header row. */
  changeNumber: string;
  title: string;
  /** The rule behind the frame, or the door's ask, beside the title. */
  explainer: ExplainerProps | null;
  /** The lead-in over the number: what was done to it. */
  sub: string;
  /** "Links {email}" under the number while a Google login is being linked. */
  links: string | null;
  block: Pick<TintedBlockProps, 'tone' | 'title'> | null;
  codeLabel: string;
  codeError: string | null;
  primary: string | null;
  /** The primary's accessible name where it says more than its label. */
  primaryAria: string | null;
  resend: string | null;
  /** The resend gap, in the waiting control's own label and its spoken name. */
  wait: { label: string; spoken: string } | null;
  call: string | null;
  /** The Google way a frame keeps open; its sentence says why it still works (`M01-04`). */
  google: { sentence: string | null; label: string; aria: string } | null;
  foot: string | null;
}

/**
 * The code family of either door — one frame per outcome, drawn once (`SCR-M01-01`, the `m-*` code
 * states and `d-code-family`; `SCR-M01-02` `m-step2-code`). The frame's structure is `domain`'s
 * and its words `i18n`'s; this draws them and raises the presses. The signup door passes its step
 * header, the wider measure and the code field's helper. A door with a step header places its
 * heading `sp-8` under it; a door without one centres its column.
 */
export interface DoorCodeStepProps {
  /**
   * The door's language control. It is page chrome from the door's breakpoint only: under it, and
   * on the phone, the header row holds the way back alone (`SCR-M01-01` "375 vertical layout"), so
   * the native half reads none.
   */
  language: ReactNode;
  words: DoorCodeStepWords;
  /** What the frame draws: the code field's state, and the press its primary and its resend raise. */
  frame: Pick<LoginFrame, 'code' | 'primary' | 'resend'>;
  /** The number the code went to, in E.164. */
  phone: string;
  code: string;
  onCode: (code: string) => void;
  /** A round trip is in flight: the primary spins and the code field waits. */
  busy: boolean;
  /** Google's sheet is opening: its control spins. */
  googleBusy: boolean;
  onPress: (control: LoginPress) => void;
  /** The signup's step header. */
  lead?: ReactNode;
  taskMeasure?: DoorTaskMeasure;
  /** The line under the code field. */
  helper?: string;
}
