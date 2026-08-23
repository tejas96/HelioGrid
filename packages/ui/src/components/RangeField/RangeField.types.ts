/** `[lo, hi]` — the whole value, in one tuple. */
export type RangeValue = [number, number];

/**
 * **Two-ended numeric range** — the control the system was missing, so `M01-38`'s *"key spec
 * ranges (e.g. wattage, technology)"* had no input at all.
 *
 * Two ways in, one value out: the track is the coarse gesture, the two boxes are the exact one, and
 * both write the same `[lo, hi]`. Both obey the commit-once law — `onInput` live during a drag,
 * `onCommit` once when it ends; the boxes commit on blur or Enter only and restore the last good
 * value when emptied.
 *
 * **The ends cannot cross.** A thumb dragged past its partner pins rather than swapping, because a
 * swap loses which handle the user is holding; a typed value past the other end is clamped to it.
 */
export interface RangeFieldProps {
  /** `[lo, hi]`, or `null` for the whole span — which is what an untouched filter dimension is. */
  value?: RangeValue | null;
  /** Live signal — fires continuously during a drag. Same split as `Slider`. */
  onInput?: (value: RangeValue) => void;
  /** Fires once: pointer release, key release, blur, or a typed box committing. */
  onCommit?: (value: RangeValue) => void;
  /** Default 0. */
  min?: number;
  /** Default 100. */
  max?: number;
  /** Default 1. */
  step?: number;
  label?: string;
  unit?: string;
  hint?: string;
  /** Formats the readout and the accessible value text — `v => money(v)`, `v => v + " W"`. */
  format?: (value: number) => string;
  /** The two typed boxes under the track. Keep them: a gloved thumb drags, a keyboard types. */
  boxes?: boolean;
  /** Default `['From', 'To']`. */
  boxLabels?: [string, string];
  disabled?: boolean;
  /** What the readout says when the pair still covers the whole span. Default "Any". */
  anyLabel?: string;
}
