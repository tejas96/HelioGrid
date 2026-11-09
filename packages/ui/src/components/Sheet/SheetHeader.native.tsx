import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { GestureResponderHandlers, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { OverlayClose } from './OverlayClose.native';
import { sheetHeaderOf } from './Sheet.logic';
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

/**
 * A sheet's title is a title: the display face, as the web's. A functional sheet, dense with
 * fields, keeps the compact UI title — 1.25 line-height on the reference's 17 size.
 */
const TITLE_LOOK: Record<SheetDensity, { variant: 'figure' | 'h4'; style?: TextStyle }> = {
  expressive: { variant: 'figure' },
  functional: { variant: 'h4', style: { fontWeight: '700', letterSpacing: -0.34, lineHeight: 21 } },
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
                variant={TITLE_LOOK[density].variant}
                style={TITLE_LOOK[density].style}
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

interface SheetHeaderSlotProps extends Omit<SheetHeaderProps, 'style'> {
  /** The drag, when no handle above the header takes it. */
  panHandlers?: GestureResponderHandlers;
}

/**
 * Where the header sits in the panel: a row of its own, or — the close alone — at the end of the
 * handle's row, as on the web, so a sheet whose content opens on its own title keeps that row.
 */
export function SheetHeaderSlot({ panHandlers, ...header }: SheetHeaderSlotProps) {
  const bare = sheetHeaderOf(header.handle, header.showClose, [
    header.title,
    header.overline,
    header.subtitle,
  ]).closeOnly;
  return (
    <View {...panHandlers} style={bare ? slot.closeOnly : undefined}>
      <SheetHeader {...header} style={bare ? slot.bare : undefined} />
    </View>
  );
}

const slot = StyleSheet.create({
  closeOnly: { position: 'absolute', top: 0, right: theme.spacing['sp-3'], zIndex: 2 },
  bare: { padding: 0, backgroundColor: 'transparent' },
});

const styles = StyleSheet.create({
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-3'],
    // biome-ignore lint/plugin/raw-white: panel — a sheet, a modal, a detail panel: a page ground over the page
    backgroundColor: colors.surface,
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
