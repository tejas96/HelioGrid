import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { OverlayClose } from '../Sheet/OverlayClose.native';

interface PanelHeaderProps {
  /** Leading node, usually an IconCircle or Avatar. */
  leading?: ReactNode;
  onClose?: () => void;
  overline?: string;
  /** The panel's density padding, resolved by the caller. */
  pad: number;
  /** The scroll shadow — luminance, never a divider line. */
  scrolled: boolean;
  showClose: boolean;
  /** Rendered in Geist Mono — job IDs, coordinates, invoice numbers. */
  subtitle?: string;
  title?: string;
}

/** The panel's sticky header: a leading node, the heading block and the 44×44 dismissal. */
export function PanelHeader({
  leading,
  onClose,
  overline,
  pad,
  scrolled,
  showClose,
  subtitle,
  title,
}: PanelHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        { paddingTop: pad, paddingHorizontal: pad },
        scrolled ? styles.scrolled : undefined,
      ]}
    >
      <View style={styles.lead}>
        {leading}
        <View style={styles.heading}>
          {overline === undefined ? null : (
            <Text variant="overline" color="tertiary" style={styles.overline}>
              {overline}
            </Text>
          )}
          {title === undefined ? null : (
            <Text variant="h2" style={titleStyle}>
              {title}
            </Text>
          )}
          {subtitle === undefined ? null : (
            <Text variant="mono" color="secondary">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showClose ? <OverlayClose offset="sheet" onClick={onClose} /> : null}
    </View>
  );
}

/* 1.2 line-height on the reference's 24px title; RN takes points, not a ratio. */
const titleStyle: TextStyle = { fontWeight: '700', letterSpacing: -0.48, lineHeight: 29 };

const styles = StyleSheet.create({
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-4'],
    backgroundColor: theme.colors['surface-form'],
    zIndex: 1,
  },
  /* The web half draws a downward-only scroll shadow; RN shadows have no spread or inset, so e2 —
     the next elevation step up from flat — carries the same "content has moved under me". */
  scrolled: theme.elevation.e2,
  lead: { flexDirection: 'row', gap: 14, alignItems: 'center', flexShrink: 1, minWidth: 0 },
  heading: { flexShrink: 1, minWidth: 0 },
  overline: { marginBottom: 6 },
});
