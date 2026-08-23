import type { ReactNode } from 'react';
import type { ValueSourceLevel, ValueSourceSpec } from '../ValueSource';

/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type TextareaDensity = 'expressive' | 'functional';

export interface TextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  /** Shows a counter that warns before it blocks. */
  maxLength?: number;
  /**
   * **Which layer supplied this wording** — rendered in the declared field slot: under the field,
   * above `helper`/`error`, so it survives a validation message appearing. `SCR-M07-09`'s
   * per-language sections are the case: *"Falling back to Hindi"* is which-layer-supplied-this, not
   * free prose in `helper`. Mutually exclusive with an override line, as in `Input`.
   *
   * A spec object, a bare level string or a ready node — all three go through `renderAttribution`,
   * which is what resolves the first two into `ValueSource`. The field's `label` is passed as the
   * spec's `fieldName`, so the override action names the field it belongs to.
   */
  attribution?: ValueSourceSpec | ValueSourceLevel | ReactNode;
  density?: TextareaDensity;
  disabled?: boolean;
  helper?: string;
  error?: string;
  name?: string;
}
