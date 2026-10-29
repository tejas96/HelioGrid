import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { OverlayClose } from './OverlayClose.native';
import type { OverlayStatus, OverlaySubtitleFace, SheetDensity } from './Sheet.types';

interface SheetHeaderProps {
  density: SheetDensity;
  /** The title's own mark, before the heading block; nothing is drawn for it when absent. */
  leading?: ReactNode;
  /** With a handle above it the header loses its own top padding, as on web. */
  handle: boolean;
  closeLabel: TranslatedText;
  onClose?: () => void;
  overline?: TranslatedText;
  /** The scroll shadow — luminance, never a divider line. */
  scrolled: boolean;
  showClose: boolean;
  status?: OverlayStatus;
  subtitle?: string;
  subtitleFace: OverlaySubtitleFace;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

/** 1.25 line-height on the reference's 20/17 title sizes; RN takes points, not a ratio. */
const TITLE: Record<SheetDensity, TextStyle> = {
  expressive: { fontWeight: '700', letterSpacing: -0.4, lineHeight: 25 },
  functional: { fontWeight: '700', letterSpacing: -0.34, lineHeight: 21 },
};

/**
 * The sheet's sticky header. The title keeps its drawn size whatever text size the person set,
 * as a platform sheet's own title does: grown, one word was wider than the line and broke inside
 * itself. `overline` is the Text primitive's own 11px signature — the one sanctioned appearance
 * below the 12px floor — so this file never re-spells it.
 */
export function SheetHeader({
  density,
  leading,
  handle,
  closeLabel,
  onClose,
  overline,
  scrolled,
  showClose,
  status,
  subtitle,
  subtitleFace,
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
      <Lead leading={leading}>
        <View style={styles.heading}>
          {overline === undefined ? null : (
            <Text variant="overline" color="tertiary" style={styles.overline}>
              {overline}
            </Text>
          )}
          {title === undefined ? null : (
            <View style={styles.titleLine}>
              <Text
                variant={density === 'functional' ? 'h4' : 'h3'}
                style={TITLE[density]}
                fixedSize
              >
                {title}
              </Text>
              {status === undefined ? null : (
                <StatusChip
                  status={status.label}
                  label={status.label}
                  tone={status.tone}
                  density="functional"
                />
              )}
            </View>
          )}
          {subtitle === undefined ? null : (
            <Text
              variant={subtitleFace === 'mono' ? 'mono' : 'body-sm'}
              color="secondary"
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </Lead>
      {showClose ? (
        <OverlayClose label={closeLabel} offset={handle ? 'handle' : 'sheet'} onClick={onClose} />
      ) : null}
    </View>
  );
}

/** The mark and the heading side by side — only when there is a mark, so no empty box is drawn. */
function Lead({ leading, children }: { leading: ReactNode; children: ReactNode }) {
  if (leading === undefined || leading === null) return children;
  return (
    <View style={styles.lead}>
      {leading}
      {children}
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
    // biome-ignore lint/plugin/raw-white: panel — a sheet, a modal, a detail panel: a page ground over the page
    backgroundColor: theme.colors.surface,
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
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    flexShrink: 1,
    minWidth: 0,
  },
  titleLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  overline: { marginBottom: 6 },
  subtitle: { marginTop: theme.spacing['sp-0-5'] },
});
