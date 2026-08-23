/* ValueSource (web) — a plain word with a layers glyph, no pill and no tint: nothing happened to
   this value, this is just where it lives. `FieldOverride` is the tinted pill with a dot; the two
   slots are mutually exclusive and the host enforces it.

   `inherited` carries "Override for this tenant" — the owner's next move, and the only action
   attribution ever has. It goes through the Pressable primitive, which owns the 44px target. */

import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import { resolveValueSourceLevel, valueSourceStep } from './ValueSource.levels';
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
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        {name === 'inherited' ? <path d="m3 14 9 5 9-5" /> : null}
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
  overrideLabel = 'Override for this tenant',
  size = 12,
  className,
  style,
}: WebValueSourceProps) {
  const entry = resolveValueSourceLevel(level);
  if (!entry) {
    return null;
  }
  const word = layerName || entry.word;
  const inherited = level === 'inherited';
  return (
    <div
      className={classNames('hg-value-source', className)}
      data-level={inherited ? 'inherited' : 'own'}
      data-size={valueSourceStep(size)}
      style={style}
    >
      <span className="hg-value-source-layer">
        <Glyph name={entry.glyph} />
        <span className="hg-value-source-word">{word}</span>
      </span>
      {source ? <span className="hg-value-source-from">{source}</span> : null}
      {inherited && onOverride ? (
        <Pressable
          className="hg-value-source-action"
          onPress={onOverride}
          accessibilityLabel={fieldName ? `${overrideLabel}: ${fieldName}` : undefined}
        >
          {overrideLabel}
        </Pressable>
      ) : null}
    </div>
  );
}

/** Accepts an `attribution` host prop — a spec object, a bare level string, or a ready node. */
export function renderAttribution(
  spec?: ValueSourceSpec | ValueSourceLevel | ReactNode,
  extra: Partial<ValueSourceSpec> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return <ValueSource level={spec as ValueSourceLevel} {...extra} />;
  }
  if (typeof spec !== 'object') {
    return null;
  }
  return <ValueSource {...(spec as ValueSourceSpec)} {...extra} />;
}

ValueSource.render = renderAttribution;
