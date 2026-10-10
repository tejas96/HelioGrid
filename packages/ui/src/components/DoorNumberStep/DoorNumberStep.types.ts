import type { DoorRoad, LoginPress } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { DoorTaskMeasure, DoorTitleProps } from '../DoorFrame/DoorFrame.types';
import type { TintedBlockProps } from '../TintedBlock/TintedBlock.types';

/** Every word the step draws beside its title; `@heliogrid/i18n`'s `numberStepWords` writes them. */
export interface DoorNumberStepWords {
  /** Above the number, in reading order. */
  blocks: readonly TintedBlockProps[];
  phoneLabel: string;
  /** The field's own answer to a number of the wrong length; absent as the step opens. */
  phoneError: string | undefined;
  primary: string;
  /** `null` on a door with no Google sheet: no divider and no control are drawn. */
  google: { or: string; label: string; aria: string } | null;
}

/**
 * Frame 1 of either door — the number as it opens, and its answers on the field (`SCR-M01-01`
 * `m-normal`, `SCR-M01-02` `m-step1-number`). The two doors share the field and the primary and
 * differ in what they pass: the title, the road at the foot, and on the signup door the step
 * header, the wider measure and the field's helper. A door with a step header places its heading
 * `sp-8` under it; a door without one centres its column.
 */
export interface DoorNumberStepProps {
  /** The header row's control: the door's language control. */
  language: ReactNode;
  title: DoorTitleProps;
  words: DoorNumberStepWords;
  /** The number as typed, in E.164. */
  phone: string;
  onPhone: (phone: string) => void;
  /** A round trip is in flight: the field locks. */
  busy: boolean;
  /** The code is on its way: the primary spins and stays the one live control. */
  sending: boolean;
  /** Google's sheet is opening: its control spins. */
  googleBusy: boolean;
  onPress: (control: Extract<LoginPress, 'send' | 'google'>) => void;
  road: DoorRoad;
  /** The signup's step header. */
  lead?: ReactNode;
  taskMeasure?: DoorTaskMeasure;
  helper?: string;
  /**
   * Stands in the form's place while the session holds a pending switch (`F4-37`): at 1536 the
   * decision is the task column's content. The phone draws it as a sheet over the step, so the
   * native half reads none.
   */
  task?: ReactNode;
}
