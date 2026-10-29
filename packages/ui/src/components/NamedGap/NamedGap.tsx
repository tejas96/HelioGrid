import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { fillActOf, namedGapFor } from './NamedGap.logic';
import type { NamedGapInput, NamedGapSpec } from './NamedGap.types';

interface WebNamedGapProps extends NamedGapSpec {
  className?: string;
  style?: CSSProperties;
}

/**
 * **An absent value, rendered honestly, at the scale of the value it replaces.** `M02-03`: the
 * missing fields are shown as NAMED GAPS — "no city yet" — and NOTHING IS INVENTED TO FILL A GAP.
 *
 * An em-dash says "nothing here"; these rows require the product to say WHAT is missing, so there
 * is no dash here, ever, and no "N/A", no "null", no empty string dressed as a value. It takes no
 * provenance tier: a tier answers how a FIGURE was arrived at, and there is no figure.
 */
export function NamedGap({
  gap,
  scale = 'field',
  align = 'left',
  onFill,
  fillLabel,
  fieldName,
  className,
  style,
}: WebNamedGapProps) {
  if (!gap) return null;
  const act = fillActOf({ onFill, fillLabel, fieldName });
  return (
    <span
      className={classNames('hg-named-gap', className)}
      data-scale={scale}
      data-align={align}
      style={style}
    >
      <span className="hg-named-gap-ring" aria-hidden="true" />
      <span className="hg-named-gap-words">{gap}</span>
      {act === null ? null : (
        <Pressable
          className="hg-named-gap-fill"
          onPress={act.onFill}
          accessibilityLabel={act.spokenName}
        >
          {act.label}
        </Pressable>
      )}
    </span>
  );
}

export function renderGap(
  spec?: NamedGapInput | null,
  extra: Partial<NamedGapSpec> = {},
): ReactNode {
  return namedGapFor(spec, (plain) => <NamedGap {...plain} {...extra} />);
}

NamedGap.render = renderGap;
