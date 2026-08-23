import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import type { NamedGapSpec } from './NamedGap.types';

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
  fillLabel = 'Add',
  fieldName,
  className,
  style,
}: WebNamedGapProps) {
  if (!gap) return null;
  return (
    <span
      className={classNames('hg-named-gap', className)}
      data-scale={scale}
      data-align={align}
      style={style}
    >
      <span className="hg-named-gap-ring" aria-hidden="true" />
      <span className="hg-named-gap-words">{gap}</span>
      {onFill ? (
        <Pressable
          className="hg-named-gap-fill"
          onPress={onFill}
          accessibilityLabel={fieldName ? `${fillLabel}: ${fieldName}` : undefined}
        >
          {fillLabel}
        </Pressable>
      ) : null}
    </span>
  );
}

function isGapSpec(value: object): value is NamedGapSpec {
  return 'gap' in value;
}

/** What every `gap` host prop runs through: a sentence, a spec, or a ready node. */
export function renderGap(
  spec?: ReactNode | NamedGapSpec,
  extra: Partial<NamedGapSpec> = {},
): ReactNode {
  if (!spec) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec === 'string') return <NamedGap gap={spec} {...extra} />;
  if (typeof spec !== 'object' || !isGapSpec(spec)) return null;
  if (!spec.gap) return null;
  return <NamedGap {...spec} {...extra} />;
}

NamedGap.render = renderGap;
