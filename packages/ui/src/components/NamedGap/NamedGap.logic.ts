import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { NamedGapInput, NamedGapSpec } from './NamedGap.types';

/**
 * The act that fills the gap, when its handler and words are given. Its spoken name adds the
 * field — "Add: Roof pitch" — when there is one to name.
 */
export function fillActOf({
  onFill,
  fillLabel,
  fieldName,
}: Pick<NamedGapSpec, 'onFill' | 'fillLabel' | 'fieldName'>): {
  onFill: () => void;
  label: TranslatedText;
  spokenName: string | undefined;
} | null {
  if (!onFill || !fillLabel) {
    return null;
  }
  return {
    onFill,
    label: fillLabel,
    spokenName: fieldName ? `${fillLabel}: ${fieldName}` : undefined,
  };
}

function isGapSpec(value: object): value is NamedGapSpec {
  return 'gap' in value;
}

/**
 * What a host's gap prop draws: a ready node as it is, a spec through `draw` (a string is its
 * gap), or nothing — a spec that names no gap says nothing.
 */
export function namedGapFor(
  spec: NamedGapInput | null | undefined,
  draw: (spec: NamedGapSpec) => ReactNode,
): ReactNode {
  if (!spec) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec === 'string') return draw({ gap: spec });
  if (typeof spec !== 'object' || !isGapSpec(spec)) return null;
  if (!spec.gap) return null;
  return draw(spec);
}
