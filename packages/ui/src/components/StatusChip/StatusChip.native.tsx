/* StatusChip (native) — same registry, same open contract, same law. Rendered through the
   StatusMark primitive so F7-12 (label plus mark, never colour alone) has exactly one implementation
   on this platform too. Density sets the chip's height; the primitive owns everything else. */

import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { STATUS_CHIP_STATUSES, statusChipTone } from './StatusChip.registry';
import type { StatusChipDensity, StatusChipProps } from './StatusChip.types';

const styles = StyleSheet.create({
  expressive: { minHeight: 28, paddingHorizontal: theme.spacing['sp-3'] },
  functional: { minHeight: 24, paddingHorizontal: theme.spacing['sp-3'] },
});

const DENSITY: Record<StatusChipDensity, ViewStyle> = {
  expressive: styles.expressive,
  functional: styles.functional,
};

interface NativeStatusChipProps extends StatusChipProps {
  style?: StyleProp<ViewStyle>;
}

export function StatusChip({
  status = 'lead',
  label,
  tone,
  density = 'expressive',
  dot = true,
  style,
}: NativeStatusChipProps) {
  return (
    <StatusMark
      tone={statusChipTone(status, tone)}
      label={label}
      mark={dot}
      style={[DENSITY[density], style]}
    />
  );
}

/** The canonical pipeline statuses, for a caller that wants to render the set. */
StatusChip.statuses = STATUS_CHIP_STATUSES;
