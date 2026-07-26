import { theme } from '@heliogrid/tokens/theme';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * Domain workflow status → fixed semantic colour. Status is never colour alone: the 6px
 * dot always sits next to a REQUIRED label, translated at the call site (unlike the web
 * ref, no baked-in English fallbacks — they would bypass Lingui).
 */

export type WorkflowStatus =
  | 'lead'
  | 'survey-scheduled'
  | 'design-in-progress'
  | 'approved'
  | 'installing'
  | 'commissioned'
  | 'on-hold';

const STATUS: Record<WorkflowStatus, { fg: string; bg: string }> = {
  lead: { fg: theme.colors.neutral, bg: theme.colors['neutral-bg'] },
  'survey-scheduled': { fg: theme.colors.info, bg: theme.colors['info-bg'] },
  'design-in-progress': { fg: theme.colors.warning, bg: theme.colors['warning-bg'] },
  approved: { fg: theme.colors.accent, bg: theme.colors['accent-subtle'] },
  installing: { fg: theme.colors.info, bg: theme.colors['info-bg'] },
  commissioned: { fg: theme.colors.success, bg: theme.colors['success-bg'] },
  'on-hold': { fg: theme.colors.danger, bg: theme.colors['danger-bg'] },
};

const HEIGHT = { expressive: 28, functional: 24 } as const;
const DOT = 6;

export interface StatusChipProps {
  status: WorkflowStatus;
  label: string;
  density?: 'expressive' | 'functional';
  style?: ViewStyle;
}

export function StatusChip({ status, label, density = 'expressive', style }: StatusChipProps) {
  const s = STATUS[status];
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.chip, { height: HEIGHT[density], backgroundColor: s.bg }, style]}
    >
      <View style={[styles.dot, { backgroundColor: s.fg }]} />
      <AppText
        role={density === 'expressive' ? 'body-sm' : 'caption'}
        weight="500"
        color={s.fg}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: DOT,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: theme.radius['r-pill'],
  },
});
