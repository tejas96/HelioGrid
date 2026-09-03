import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { OverlayClose } from './OverlayClose.native';
import type { SheetDensity } from './Sheet.types';

interface SheetHeaderProps {
  density: SheetDensity;
  /** With a handle above it the header loses its own top padding, as on web. */
  handle: boolean;
  onClose?: () => void;
  overline?: string;
  /** The scroll shadow — luminance, never a divider line. */
  scrolled: boolean;
  showClose: boolean;
  subtitle?: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

/** 1.25 line-height on the reference's 20/17 title sizes; RN takes points, not a ratio. */
const TITLE: Record<SheetDensity, TextStyle> = {
  expressive: { fontWeight: '700', letterSpacing: -0.4, lineHeight: 25 },
  functional: { fontWeight: '700', letterSpacing: -0.34, lineHeight: 21 },
};

/**
 * The sheet's sticky header. `overline` is the Text primitive's own 11px signature — the one
 * sanctioned appearance below the 12px floor — so this file never re-spells it.
 */
export function SheetHeader({
  density,
  handle,
  onClose,
  overline,
  scrolled,
  showClose,
  subtitle,
  title,
  style,
}: SheetHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        density === 'functional' ? styles.headerFunctional : styles.headerExpressive,
        handle ? styles.headerWithHandle : undefined,
        scrolled ? styles.scrolled : undefined,
        style,
      ]}
    >
      <View style={styles.heading}>
        {overline === undefined ? null : (
          <Text variant="overline" color="tertiary" style={styles.overline}>
            {overline}
          </Text>
        )}
        {title === undefined ? null : (
          <Text variant={density === 'functional' ? 'h4' : 'h3'} style={TITLE[density]}>
            {title}
          </Text>
        )}
        {subtitle === undefined ? null : (
          <Text variant="body-sm" color="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      {showClose ? <OverlayClose offset="sheet" onClick={onClose} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-3'],
    backgroundColor: theme.colors['surface-form'],
    zIndex: 1,
  },
  /* 10 has no spacing token — it is the reference's own functional top padding. */
  headerExpressive: { paddingTop: theme.spacing['sp-3'], paddingHorizontal: theme.spacing['sp-5'] },
  headerFunctional: { paddingTop: 10, paddingHorizontal: theme.spacing['sp-4'] },
  headerWithHandle: { paddingTop: 0 },
  /* The web half draws a downward-only scroll shadow; RN shadows have no spread or inset, so e2 —
     the next elevation step up from flat — carries the same "content has moved under me". */
  scrolled: theme.elevation.e2,
  heading: { flexShrink: 1, minWidth: 0 },
  overline: { marginBottom: 6 },
  subtitle: { marginTop: theme.spacing['sp-0-5'] },
});
