/* ValueSource (web) — a plain word with a layers glyph, no pill and no tint: nothing happened to
   this value, this is just where it lives. `FieldOverride` is the tinted pill with a dot; the two
   slots are mutually exclusive and the host enforces it.

   `inherited` carries "Override for this tenant" — the owner's next move, and the only action
   attribution ever has. It goes through the Pressable primitive, which owns the 44px target. */

import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import {
  attributionFor,
  overrideActOf,
  resolveValueSourceLevel,
  VALUE_SOURCE_GLYPH,
  valueSourceStep,
} from './ValueSource.levels';
import type { ValueSourceLevel, ValueSourceSpec } from './ValueSource.types';

interface WebValueSourceProps extends ValueSourceSpec {
  className?: string;
  style?: CSSProperties;
}

function Glyph({ name }: { name: 'own' | 'inherited' }) {
  return (
    <Icon size="xs">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <ShellGlyphMarks name={VALUE_SOURCE_GLYPH[name]} />
      </svg>
    </Icon>
  );
}

export function ValueSource({
  level = 'own',
  layerName,
  source,
  fieldName,
  onOverride,
  overrideLabel,
  size = 12,
  className,
  style,
}: WebValueSourceProps) {
  const entry = resolveValueSourceLevel(level);
  if (!entry) {
    return null;
  }
  const inherited = level === 'inherited';
  const act = overrideActOf({ level, onOverride, overrideLabel, fieldName });
  return (
    <div
      className={classNames('hg-value-source', className)}
      data-level={inherited ? 'inherited' : 'own'}
      data-size={valueSourceStep(size)}
      style={style}
    >
      <span className="hg-value-source-layer">
        <Glyph name={entry.glyph} />
        <span className="hg-value-source-word">{layerName}</span>
      </span>
      {source ? <span className="hg-value-source-from">{source}</span> : null}
      {act === null ? null : (
        <Pressable
          className="hg-value-source-action"
          onPress={act.onOverride}
          accessibilityLabel={act.spokenName}
        >
          {act.label}
        </Pressable>
      )}
    </div>
  );
}

/**
 * Accepts an `attribution` host prop — a spec object, a bare level string, or a ready node. A bare
 * level names no layer, and a layer's word is the caller's, so it draws nothing: the words come in
 * a spec.
 */
export function renderAttribution(
  spec?: ValueSourceSpec | ValueSourceLevel | ReactNode,
  extra: Partial<ValueSourceSpec> = {},
): ReactNode {
  return attributionFor(spec, (plain) => <ValueSource {...plain} {...extra} />);
}

ValueSource.render = renderAttribution;
