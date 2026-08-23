import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ComplianceFloorSpec } from './ComplianceFloor.types';
import { complianceFloorWords } from './ComplianceFloor.words';

interface WebComplianceFloorProps extends ComplianceFloorSpec {
  className?: string;
  style?: CSSProperties;
}

/* A statute, not a padlock. A padlock says "you are shut out" — the ScopeNote reading, and false:
   the owner is not shut out of this row, they may edit and move it. The shield says the row is
   protected. */
function ShieldGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.2 5 6.1v5.6c0 4.1 2.8 7.3 7 9 4.2-1.7 7-4.9 7-9V6.1l-7-2.9Z" />
      <path d="M9.2 12.2l2 2 3.6-3.9" />
    </svg>
  );
}

/** A floor named on the row it protects, or the save it refused. */
export function ComplianceFloor(props: WebComplianceFloorProps) {
  const { action, variant = 'line', size = 12, message, className, style } = props;
  const { head, named, body } = complianceFloorWords(props);
  const step = Math.max(12, size);

  if (variant === 'refusal') {
    return (
      <div
        role="alert"
        className={classNames('hg-compliance-floor-refusal', className)}
        style={style}
      >
        <span className="hg-compliance-floor-refusal-glyph">
          <ShieldGlyph size={18} />
        </span>
        <div className="hg-compliance-floor-refusal-body">
          <p className="hg-compliance-floor-refusal-head">{head}</p>
          {body === null ? null : <p className="hg-compliance-floor-refusal-note">{body}</p>}
          {action}
        </div>
      </div>
    );
  }

  return (
    <div
      role="note"
      className={classNames('hg-compliance-floor', className)}
      data-size={step >= 13 ? '13' : '12'}
      style={style}
    >
      <span className="hg-compliance-floor-glyph">
        <ShieldGlyph size={step + 1} />
      </span>
      <span className="hg-compliance-floor-words">
        <span className="hg-compliance-floor-head">{head}</span>
        {named === '' ? null : <span className="hg-compliance-floor-named">{` · ${named}`}</span>}
        {message === undefined ? null : (
          <span className="hg-compliance-floor-named">{` ${message}`}</span>
        )}
      </span>
    </div>
  );
}

function isFloorSpec(value: object): value is ComplianceFloorSpec {
  return !(Symbol.iterator in value);
}

/** What every `lock` / `floor` host prop runs through: a spec object, or a ready node. */
export function renderComplianceFloor(
  spec?: ComplianceFloorSpec | ReactNode,
  extra: Partial<ComplianceFloorSpec> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec !== 'object' || !isFloorSpec(spec)) {
    return null;
  }
  return <ComplianceFloor {...spec} {...extra} />;
}

ComplianceFloor.render = renderComplianceFloor;
