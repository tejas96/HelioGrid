import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { OverlayClose } from '../Sheet/OverlayClose.native';
import type { OverlayStatus, OverlaySubtitleFace } from '../Sheet/Sheet.types';
import { StatusChip } from '../StatusChip/StatusChip.native';

interface PanelHeaderProps {
  /** Leading node, usually an IconCircle or Avatar. */
  leading?: ReactNode;
  closeLabel: TranslatedText;
  onClose?: () => void;
  overline?: TranslatedText;
  /** The panel's density padding, resolved by the caller. */
  pad: number;
  /** The scroll shadow — luminance, never a divider line. */
  scrolled: boolean;
  showClose: boolean;
  status?: OverlayStatus;
  /** Rendered in Geist Mono — job IDs, coordinates, invoice numbers. */
  subtitle?: string;
  subtitleFace: OverlaySubtitleFace;
  title?: string;
}

/** The panel's sticky header: a leading node, the heading block and the 44×44 dismissal. */
export function PanelHeader({
  leading,
  closeLabel,
  onClose,
  overline,
  pad,
  scrolled,
  showClose,
  status,
  subtitle,
  subtitleFace,
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
            <View style={styles.titleLine}>
              <Text variant="h2" style={titleStyle}>
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
            <Text variant={subtitleFace === 'mono' ? 'mono' : 'body-sm'} color="secondary">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showClose ? <OverlayClose label={closeLabel} offset="sheet" onClick={onClose} /> : null}
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
    // biome-ignore lint/plugin/raw-white: panel — a sheet, a modal, a detail panel: a page ground over the page
    backgroundColor: theme.colors.surface,
    zIndex: 1,
  },
  /* The web half draws a downward-only scroll shadow; RN shadows have no spread or inset, so e2 —
     the next elevation step up from flat — carries the same "content has moved under me". */
  scrolled: theme.elevation.e2,
  lead: { flexDirection: 'row', gap: 14, alignItems: 'center', flexShrink: 1, minWidth: 0 },
  heading: { flexShrink: 1, minWidth: 0 },
  titleLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  overline: { marginBottom: 6 },
});
