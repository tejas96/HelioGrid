import type { CSSProperties } from 'react';
import { StatusMark } from '../../primitives/StatusMark';
import { LEAD_STATE_TONE } from './LeadStateBadge.logic';
import type { LeadStateBadgeProps } from './LeadStateBadge.types';

interface WebLeadStateBadgeProps extends LeadStateBadgeProps {
  className?: string;
  style?: CSSProperties;
}

/** A lead's R9 state as glyph, word and tint — through `StatusMark`, never colour alone. */
export function LeadStateBadge({ state, label, className, style }: WebLeadStateBadgeProps) {
  return (
    <StatusMark tone={LEAD_STATE_TONE[state]} label={label} className={className} style={style} />
  );
}
