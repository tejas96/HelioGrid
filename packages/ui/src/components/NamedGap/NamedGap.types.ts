import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactElement } from 'react';

export interface NamedGapSpec {
  /**
   * The sentence, and it names **what** is missing: "No city yet", "No schedule yet", "No survey
   * date yet". Never a dash, never "N/A", never an empty string dressed as a value.
   */
  gap?: TranslatedText | ReactElement;
  /**
   * `headline` — a stat's value footprint (15px). `field` — under a label (13px). `cell` — a table
   * cell (13px). Never the value's own 32px: a gap states, it does not shout.
   */
  scale?: 'headline' | 'field' | 'cell';
  align?: 'left' | 'center' | 'right';
  /** Optional act that fills it. `M02-03` forbids inventing the value, not asking for it. */
  onFill?: () => void;
  /** The act's word — "Add". The act is drawn only with `onFill` and this. */
  fillLabel?: TranslatedText;
  /** Named in the action's accessible label, so a screen reader hears which field it fills. */
  fieldName?: TranslatedText;
}

/** What every `gap` host prop takes: the sentence, a spec, or a ready node. */
export type NamedGapInput = TranslatedText | ReactElement | NamedGapSpec;

/** The three scales, and the one place each scale's ring and gap are declared. */
export type NamedGapScale = NonNullable<NamedGapSpec['scale']>;
