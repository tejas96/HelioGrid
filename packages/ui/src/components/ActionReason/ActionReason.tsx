import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ShellGlyphSize } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { actionReasonFor, noteLineScale } from './ActionReason.logic';
import type { ActionReasonInput, ActionReasonSpec } from './ActionReason.types';

interface WebActionReasonProps extends ActionReasonSpec {
  className?: string;
  style?: CSSProperties;
}

/* A barred circle: "not yet". Deliberately not UnavailableNote's SLASHED circle (that says "not a
   thing here"), and deliberately not error's exclamation — nothing has gone wrong. The px are SVG
   geometry, not layout: the glyph tracks the sentence at one step above its size. */
function BarredCircle({ size }: { size: ShellGlyphSize }) {
  return <ShellGlyph name="minus-circle" size={size} tone="current" />;
}

/** The precondition sentence beside a control that is off. Renders nothing without a reason. */
export function ActionReason({
  reason,
  id,
  size = 12,
  align = 'left',
  className,
  style,
}: WebActionReasonProps) {
  if (!reason) {
    return null;
  }
  const scale = noteLineScale(size);
  return (
    <span
      id={id}
      className={classNames('hg-action-reason', className)}
      data-align={align}
      data-size={scale.large ? '13' : '12'}
      style={style}
    >
      <span className="hg-action-reason-glyph">
        <BarredCircle size={scale.glyphSize} />
      </span>
      <span className="hg-action-reason-words">{reason}</span>
    </span>
  );
}

/** What every `disabledReason` host prop runs through: a string, a spec, or a ready node. */
export function renderActionReason(
  spec?: ActionReasonInput | null,
  extra: Partial<ActionReasonSpec> = {},
): ReactNode {
  return actionReasonFor(spec, (plain) => <ActionReason {...plain} {...extra} />);
}

ActionReason.render = renderActionReason;
