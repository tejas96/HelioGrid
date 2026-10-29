import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import { DISCLOSURE_ORDER } from './Disclosure.lines';
import type { DisclosureInput, DisclosureKind, DisclosureSpec } from './Disclosure.types';

/**
 * A disclosure draws only with a line to say: `kind="custom"` with no `text` warns and draws
 * nothing.
 */
export function hasDisclosureLine(line: string | undefined): line is string {
  if (line === undefined) {
    console.warn('Disclosure: kind="custom" needs `text`. Nothing rendered.');
    return false;
  }
  return true;
}

function toSpec(item: DisclosureKind | DisclosureSpec): DisclosureSpec {
  return typeof item === 'string' ? { kind: item } : item;
}

/** A disclosure's key in a set: a kind appears once, but two custom lines differ by their words. */
export function disclosureKey(spec: DisclosureSpec): string {
  return `${spec.kind}|${spec.text ?? ''}|${spec.detail ?? ''}`;
}

/**
 * A set's members, every true line in document order: blanks dropped, a ruled kind kept once,
 * every `custom` line kept.
 */
export function orderedDisclosures(
  items: readonly (DisclosureKind | DisclosureSpec)[],
): DisclosureSpec[] {
  const seen = new Set<DisclosureKind>();
  return items
    .filter((item): item is DisclosureKind | DisclosureSpec => Boolean(item))
    .map(toSpec)
    .filter((spec) => {
      if (spec.kind === 'custom' || !seen.has(spec.kind)) {
        seen.add(spec.kind);
        return true;
      }
      return false;
    })
    .sort((a, b) => DISCLOSURE_ORDER.indexOf(a.kind) - DISCLOSURE_ORDER.indexOf(b.kind));
}

function isDisclosureSpec(value: object): value is DisclosureSpec {
  return 'kind' in value;
}

function asKind(value: string): DisclosureKind | undefined {
  return DISCLOSURE_ORDER.find((kind) => kind === value);
}

/**
 * What a `disclosure` / `disclaimer` host prop draws: a ready node as it is, a spec through `draw`
 * (a bare kind becomes one), or nothing. A string that names no kind warns and draws nothing.
 */
export function disclosureFor(
  spec: DisclosureInput,
  draw: (spec: DisclosureSpec) => ReactNode,
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    const kind = asKind(spec);
    if (kind === undefined) {
      console.warn(`Disclosure: "${spec}" is not a disclosure kind. Nothing rendered.`);
      return null;
    }
    return draw({ kind });
  }
  if (typeof spec !== 'object' || !isDisclosureSpec(spec)) {
    return null;
  }
  return draw(spec);
}
