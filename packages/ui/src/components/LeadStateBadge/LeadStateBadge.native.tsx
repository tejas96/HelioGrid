import type { StyleProp, ViewStyle } from 'react-native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { LEAD_STATE_TONE } from './LeadStateBadge.logic';
import type { LeadStateBadgeProps } from './LeadStateBadge.types';

interface NativeLeadStateBadgeProps extends LeadStateBadgeProps {
  style?: StyleProp<ViewStyle>;
}

/** A lead's R9 state as glyph, word and tint — a `StatusChip`, as a proposal's standing is, never colour alone. */
export function LeadStateBadge({ state, label, style }: NativeLeadStateBadgeProps) {
  return <StatusChip status={state} tone={LEAD_STATE_TONE[state]} label={label} style={style} />;
}
