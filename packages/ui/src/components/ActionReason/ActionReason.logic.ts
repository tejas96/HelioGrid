import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';
import type {
  ActionReasonInput,
  ActionReasonSentence,
  ActionReasonSpec,
} from './ActionReason.types';

/** The sentence a reason carries: words or a node as given, a spec's `reason`. */
export function reasonText(spec?: ActionReasonInput | null): TranslatedText | ReactElement | null {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec) || typeof spec === 'string') {
    return spec;
  }
  return spec.reason ? spec.reason : null;
}

/** The sentence as the Explainer's one page; `''` when there is none, which opens no bubble. */
export function reasonPage(spec?: ActionReasonSentence | null): TranslatedText | '' {
  const sentence = reasonText(spec);
  return typeof sentence === 'string' ? sentence : '';
}

/**
 * A note line's scale — the reason, the compliance floor: never under the 12px type floor, its
 * glyph a step above its words.
 */
export function noteLineScale(size: number): {
  fontSize: number;
  glyphSize: number;
  large: boolean;
} {
  const fontSize = Math.max(12, size);
  return { fontSize, glyphSize: fontSize + 1, large: fontSize >= 13 };
}

/**
 * What a `disabledReason` host prop draws: a ready node as it is, a spec through `draw` (a string
 * is its reason), or nothing — a spec with no reason says nothing.
 */
export function actionReasonFor(
  spec: ActionReasonInput | null | undefined,
  draw: (spec: ActionReasonSpec) => ReactNode,
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return draw({ reason: spec });
  }
  return spec.reason ? draw(spec) : null;
}
