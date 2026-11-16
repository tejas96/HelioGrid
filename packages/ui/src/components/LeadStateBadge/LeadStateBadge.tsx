import type { CSSProperties } from 'react';
import { StatusChip } from '../StatusChip';
import { LEAD_STATE_TONE } from './LeadStateBadge.logic';
import type { LeadStateBadgeProps } from './LeadStateBadge.types';

interface WebLeadStateBadgeProps extends LeadStateBadgeProps {
  className?: string;
  style?: CSSProperties;
}

/** A lead's R9 state as glyph, word and tint — a `StatusChip`, as a proposal's standing is, never colour alone. */
export function LeadStateBadge({ state, label, className, style }: WebLeadStateBadgeProps) {
  return (
    <StatusChip
      status={state}
      tone={LEAD_STATE_TONE[state]}
      label={label}
      className={className}
      style={style}
    />
  );
}
