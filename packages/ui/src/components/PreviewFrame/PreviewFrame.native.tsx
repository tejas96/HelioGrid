import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { Children, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useLoadingPulse } from '../LoadingBars/use-loading-pulse.native';
import type {
  PreviewFrameGroupProps,
  PreviewFrameProps,
  PreviewSurface,
} from './PreviewFrame.types';
import { DEFAULT_DESIGN_WIDTH, DEFAULT_MIN_SCALE } from './PreviewFrame.types';
import { previewGeometry } from './preview-geometry';

type NativePreviewFrameProps = PreviewFrameProps & {
  style?: StyleProp<ViewStyle>;
};

interface NativePreviewFrameGroupProps extends PreviewFrameGroupProps {
  style?: StyleProp<ViewStyle>;
}

const SURFACE: Record<PreviewSurface, ViewStyle> = {
  sheet: {
    // biome-ignore lint/plugin/raw-white: full-screen-ground — a screen that is its own page
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-lg'],
    ...theme.elevation.e3,
  },
  page: {
    backgroundColor: theme.colors.canvas,
    borderRadius: theme.radius['r-lg'],
    ...theme.elevation.e2,
  },
  band: {
    // biome-ignore lint/plugin/raw-white: full-screen-ground — a screen that is its own page
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    ...theme.elevation.e1,
  },
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column', gap: theme.spacing['sp-2'], minWidth: 0 },
  window: { width: '100%', overflow: 'hidden' },
  caption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  words: { flexShrink: 1, minWidth: 0 },
  action: { flexShrink: 0 },
  note: { color: theme.colors['warning-text'] },
  /* The web half's sweep is --canvas-sunken under --fill; the phone pulses the sunken ground. */
  loading: { backgroundColor: theme.colors['canvas-sunken'], shadowOpacity: 0, elevation: 0 },
  hidden: { opacity: 0 },
});

/**
 * A FRAME THAT HOSTS SUBJECTS, not a preview per screen.
 *
 * WEB → RN MAPPING for the non-interactive guarantee: the web half pairs `pointer-events: none`
 * with `tabindex="-1"` on every focusable inside, kept in step by a MutationObserver, and
 * deliberately avoids `inert` so the subject stays readable to assistive technology. RN has no
 * tab order and no MutationObserver, so `pointerEvents="none"` alone carries the whole
 * guarantee — and it does NOT hide the subtree from the screen reader, which is the property
 * the web half went out of its way to keep.
 *
 * RN scales about the CENTRE, so the top-left origin the crop depends on is restored by the
 * compensating translate below.
 */
export function PreviewFrame({
  label,
  caption,
  note,
  designWidth = DEFAULT_DESIGN_WIDTH,
  designHeight,
  minScale = DEFAULT_MIN_SCALE,
  maxHeight,
  surface = 'sheet',
  action,
  croppedLabel,
  loading = false,
  loadingLabel,
  children,
  style,
}: NativePreviewFrameProps) {
  const pulse = useLoadingPulse(loading);
  const [ownWidth, setOwnWidth] = useState<number | null>(null);
  const [subjectHeight, setSubjectHeight] = useState<number | null>(null);
  const { scale, cropped, boxHeight } = previewGeometry(
    ownWidth,
    designWidth,
    designHeight,
    minScale,
    maxHeight,
  );
  const naturalHeight = designHeight ?? subjectHeight ?? 0;

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setOwnWidth(event.nativeEvent.layout.width)}
      style={[styles.root, style]}
    >
      {label === undefined ? null : (
        <Text variant="overline" color="tertiary">
          {label}
        </Text>
      )}
      {/* Loading keeps the footprint: the subject still lays out, unseen and out of the reader's
          reach, under the sunken pulse — a wait, never a blank sheet of the subject's paper. */}
      <Animated.View
        style={[
          styles.window,
          SURFACE[surface],
          // The pulse stays attached: it reads full ink when not loading, and a native-driven prop that
          // leaves the style mid-life trips Fabric on Android (an assertion in its prop update).
          { opacity: pulse },
          loading ? styles.loading : undefined,
          boxHeight === null ? undefined : { height: boxHeight },
        ]}
      >
        <View
          pointerEvents="none"
          accessibilityElementsHidden={loading}
          importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
          onLayout={(event: LayoutChangeEvent) => setSubjectHeight(event.nativeEvent.layout.height)}
          style={[
            {
              width: designWidth,
              ...(designHeight === undefined ? {} : { height: designHeight }),
              transform: [
                { translateX: -(designWidth * (1 - scale)) / 2 },
                { translateY: -(naturalHeight * (1 - scale)) / 2 },
                { scale },
              ],
            },
            loading ? styles.hidden : undefined,
          ]}
        >
          {children}
        </View>
        {loading ? <Wait label={loadingLabel} /> : null}
      </Animated.View>
      <FrameCaption
        caption={caption}
        note={note}
        cropped={cropped}
        croppedLabel={croppedLabel}
        action={action}
      />
    </View>
  );
}

/**
 * While the subject loads, one element over the window, named by the label and marked busy — web's
 * `role="status"` has no RN spelling. It exists only for the wait: busy props set on the window
 * itself outlive the wait on Android, which keeps a prop that leaves the props.
 */
function Wait({ label }: { label: TranslatedText | undefined }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** The words under the window: the caller's caption, the cropped line, the note and an act. */
function FrameCaption({
  caption,
  note,
  cropped,
  croppedLabel,
  action,
}: {
  caption: NativePreviewFrameProps['caption'];
  note: NativePreviewFrameProps['note'];
  cropped: boolean;
  croppedLabel: TranslatedText | undefined;
  action: NativePreviewFrameProps['action'];
}) {
  const croppedShown = cropped && croppedLabel !== undefined;
  if (caption === undefined && note === undefined && !croppedShown && !action) return null;
  return (
    <View style={styles.caption}>
      <View style={styles.words}>
        {caption === undefined ? null : (
          <Text variant="caption" color="tertiary">
            {caption}
          </Text>
        )}
        {croppedShown ? (
          <Text variant="caption" color="tertiary">
            {croppedLabel}
          </Text>
        ) : null}
        {note === undefined ? null : (
          <Text variant="caption" style={styles.note}>
            {note}
          </Text>
        )}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

/** Two subjects, one state — the document and page side by side, stacking on a phone. */
export function PreviewFrameGroup({
  children,
  stackBelow = 560,
  gap = 20,
  style,
}: NativePreviewFrameGroupProps) {
  const [ownWidth, setOwnWidth] = useState<number | null>(null);
  const stacked = ownWidth !== null && ownWidth < stackBelow;
  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setOwnWidth(event.nativeEvent.layout.width)}
      style={[{ flexDirection: stacked ? 'column' : 'row', gap, alignItems: 'flex-start' }, style]}
    >
      {Children.map(children, (child) => (
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>{child}</View>
      ))}
    </View>
  );
}

PreviewFrame.Group = PreviewFrameGroup;
