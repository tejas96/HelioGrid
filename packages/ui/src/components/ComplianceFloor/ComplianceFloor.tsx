import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { noteLineScale } from '../ActionReason/ActionReason.logic';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { complianceFloorFor } from './ComplianceFloor.logic';
import type { ComplianceFloorSpec } from './ComplianceFloor.types';
import { complianceFloorSentences } from './ComplianceFloor.words';

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
      <ShellGlyphMarks name="shield-check" />
    </svg>
  );
}

/** A floor named on the row it protects, or the save it refused. */
export function ComplianceFloor(props: WebComplianceFloorProps) {
  const { action, variant = 'line', size = 12, message, className, style } = props;
  const { head, named, body } = complianceFloorSentences(props);
  const scale = noteLineScale(size);

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
      data-size={scale.large ? '13' : '12'}
      style={style}
    >
      <span className="hg-compliance-floor-glyph">
        <ShieldGlyph size={scale.glyphSize} />
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

export function renderComplianceFloor(
  spec?: ComplianceFloorSpec | ReactNode,
  extra: Partial<ComplianceFloorSpec> = {},
): ReactNode {
  return complianceFloorFor(spec, (plain) => <ComplianceFloor {...plain} {...extra} />);
}

ComplianceFloor.render = renderComplianceFloor;
