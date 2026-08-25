/* StatusChip (web) — a lifecycle state: something a record IS, that changes over time. `Chip` is
   for a tag, a facet or a filter token, which is something a record HAS.

   It renders THROUGH the StatusMark primitive rather than drawing its own pill: F7-12 —
   label plus mark, never colour alone — is that primitive's law, and a component that re-implements
   it is the defect the primitive exists to prevent. Density is the only thing added on top, and it
   rides a class into StatusChip.css so no inline style is needed. */

import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { StatusMark } from '../../primitives/StatusMark';
import { resolveStatusChip, STATUS_CHIP_STATUSES } from './StatusChip.registry';
import type { StatusChipProps } from './StatusChip.types';

interface WebStatusChipProps extends StatusChipProps {
  className?: string;
  /** Declared by the design system's own StatusChip contract, and by the native half. */
  style?: CSSProperties;
}

export function StatusChip({
  status = 'lead',
  label,
  tone,
  density = 'expressive',
  dot = true,
  className,
  style,
}: WebStatusChipProps) {
  const resolved = resolveStatusChip(status, tone, label);
  return (
    <StatusMark
      tone={resolved.tone}
      label={resolved.words}
      mark={dot}
      className={classNames('hg-status-chip', `hg-status-chip-${density}`, className)}
      style={style}
    />
  );
}

/** The canonical pipeline statuses, for a caller that wants to render the set. */
StatusChip.statuses = STATUS_CHIP_STATUSES;
