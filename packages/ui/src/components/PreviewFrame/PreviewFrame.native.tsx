import { theme } from '@heliogrid/theme';
import { Children, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type {
  PreviewFrameGroupProps,
  PreviewFrameProps,
  PreviewSurface,
} from './PreviewFrame.types';
import { DEFAULT_DESIGN_WIDTH, DEFAULT_MIN_SCALE } from './PreviewFrame.types';
import { previewGeometry } from './preview-geometry';

interface NativePreviewFrameProps extends PreviewFrameProps {
  style?: StyleProp<ViewStyle>;
}

interface NativePreviewFrameGroupProps extends PreviewFrameGroupProps {
  style?: StyleProp<ViewStyle>;
}

const SURFACE: Record<PreviewSurface, ViewStyle> = {
  sheet: {
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
  children,
  style,
}: NativePreviewFrameProps) {
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
      <View
        style={[
          styles.window,
          SURFACE[surface],
          boxHeight === null ? undefined : { height: boxHeight },
        ]}
      >
        <View
          pointerEvents="none"
          onLayout={(event: LayoutChangeEvent) => setSubjectHeight(event.nativeEvent.layout.height)}
          style={{
            width: designWidth,
            ...(designHeight === undefined ? {} : { height: designHeight }),
            transform: [
              { translateX: -(designWidth * (1 - scale)) / 2 },
              { translateY: -(naturalHeight * (1 - scale)) / 2 },
              { scale },
            ],
          }}
        >
          {children}
        </View>
      </View>
      {caption === undefined && note === undefined && !cropped && !action ? null : (
        <View style={styles.caption}>
          <View style={styles.words}>
            {caption === undefined ? null : (
              <Text variant="caption" color="tertiary">
                {caption}
              </Text>
            )}
            {cropped ? (
              <Text variant="caption" color="tertiary">
                Showing the top left, at a size you can read.
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
      )}
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
