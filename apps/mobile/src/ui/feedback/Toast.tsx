import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * White toast card with leading semantic icon in a circular tint; sits above bottom nav.
 * Web ref: _ds_bundle components/feedback/Toast.jsx (task spec pins elevation e4).
 * RN adaptation: the web default check SVG is replaced by an 8px tone dot when no icon
 * is passed (no SVG lib bundled; status = dot + label per DS law). Pass Lucide RN icons
 * pre-coloured with the tone colour once the icon package lands.
 */
const TONES = {
  success: { fg: theme.colors.success, bg: theme.colors['success-bg'] },
  warning: { fg: theme.colors.warning, bg: theme.colors['warning-bg'] },
  danger: { fg: theme.colors.danger, bg: theme.colors['danger-bg'] },
  info: { fg: theme.colors.info, bg: theme.colors['info-bg'] },
  neutral: { fg: theme.colors.neutral, bg: theme.colors['neutral-bg'] },
} as const;

export type ToastTone = keyof typeof TONES;

export interface ToastProps {
  tone?: ToastTone;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  style?: ViewStyle;
}

// Web-ref dimensions (component spec, not spacing-scale values).
const MAX_WIDTH = 420;
const ICON_CIRCLE = 36;
const DEFAULT_DOT = 8;

export function Toast({ tone = 'success', title, description, icon, action, style }: ToastProps) {
  const { fg, bg } = TONES[tone];
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.root, style]}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        {icon ?? <View style={[styles.defaultDot, { backgroundColor: fg }]} />}
      </View>
      <View style={styles.body}>
        <AppText style={styles.title} weight="700">
          {title}
        </AppText>
        {description != null && (
          <AppText color={theme.colors['text-secondary']} role="body-sm">
            {description}
          </AppText>
        )}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    maxWidth: MAX_WIDTH,
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    ...theme.elevation.e4,
  },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: ICON_CIRCLE / 2,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultDot: {
    width: DEFAULT_DOT,
    height: DEFAULT_DOT,
    borderRadius: DEFAULT_DOT / 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    letterSpacing: theme.typography.button.letterSpacing,
  },
});
