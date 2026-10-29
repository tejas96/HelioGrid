import type { TranslatedText } from '@heliogrid/contracts';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';

/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type SliderDensity = 'expressive' | 'functional';

/** The steppers' spoken names, in the reader's language. */
export interface SliderWords {
  /** The minus's name — the slider's `label` in it, or the bare value's when it has none. */
  decrease: (name?: TranslatedText) => TranslatedText;
  /** The plus's name, the same way. */
  increase: (name?: TranslatedText) => TranslatedText;
}

export interface SliderProps {
  value?: number;
  /**
   * Live signal — fires continuously during a drag. **Wire this to the preview**, and open the
   * editor holding this slider with no backdrop, so the geometry behind it actually repaints while
   * the drag happens (`MS3-27`, `MS3-30`, `MS6-19`).
   */
  onInput?: (value: number) => void;
  /** Commit signal — fires ONCE when the drag/keypress ends. Wire this to state and undo. */
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: TranslatedText;
  /** Displayed after the value; the unit toggle itself is a SegmentedControl. */
  unit?: string;
  /** Role-aware line under the track. */
  hint?: TranslatedText;
  /** The steppers' names — `sliderWords(t)`. */
  words: SliderWords;
  /** Custom value formatter — overrides value + unit. */
  format?: (value: number) => string;
  /** 44px minus/plus buttons either side. On by default (MS12-26). */
  steppers?: boolean;
  disabled?: boolean;
  density?: SliderDensity;
  id?: string;
  /**
   * Provenance for the value, directly under the track and above the hint.
   *
   * A full props object or a bare tier — both go through `renderProvenance`, which resolves them
   * into `Provenance` at the 12px type floor. `"unmarked"` renders nothing and records that the
   * absence is deliberate.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
}
