import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { Portal } from '../../primitives/Portal/Portal.native';
import { OverlayBody } from '../Sheet/OverlayBody.native';
import { SheetBackdrop } from '../Sheet/SheetBackdrop.native';
import type { DetailPanelProps } from './DetailPanel.types';
import { PanelHeader } from './PanelHeader.native';
import { PanelSkeleton } from './PanelSkeleton.native';

interface NativeDetailPanelProps extends DetailPanelProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Right-edge master-detail drawer (480dp default). Same backdrop law as `Sheet` — fades the layer
 * behind toward white, never a dark scrim. Slides from the edge, e5.
 *
 * **Its width is `min(width, 100%)` and there is no second breakpoint here.** In a layer narrower
 * than `width` the panel fills it; the sheet-or-panel decision belongs to `EditorSurface`.
 *
 * THREE WEB BEHAVIOURS MAPPED FOR TOUCH: `position: fixed` becomes the Portal primitive; Esc and
 * the DOM focus trap become the backdrop tap plus `accessibilityViewIsModal`; the body scroll lock
 * is inherent to a modal layer that covers the screen, and a non-modal one sets
 * `pointerEvents="box-none"` so the surface behind stays live — the same three-together decision.
 * `inset` has no meaning here: an RN overlay always leaves its screen through the Portal.
 */
export function DetailPanel({
  open = true,
  onClose,
  side = 'right',
  width = 480,
  title,
  subtitle,
  overline,
  leading = null,
  meta = null,
  children,
  density = 'functional',
  footer = null,
  showClose = true,
  dismissible = true,
  modal = true,
  state = 'ready',
  errorTitle = "Couldn't load this record",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  emptyAction = null,
  unavailableTitle,
  unavailableMessage,
  unavailableAction = null,
  style,
}: NativeDetailPanelProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const [panelWidth, setPanelWidth] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!open || panelWidth === 0) {
      return;
    }
    enter.setValue(1);
    const animation = Animated.timing(enter, {
      toValue: 0,
      duration: theme.motion.durations.emphasised,
      easing: Easing.bezier(...theme.motion.easings.standard),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [open, panelWidth, enter]);

  if (!open) {
    return null;
  }

  const pad = density === 'expressive' ? theme.spacing['sp-8'] : theme.spacing['sp-6'];
  const onLayout = (event: LayoutChangeEvent) => setPanelWidth(event.nativeEvent.layout.width);
  const slide = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [0, side === 'left' ? -panelWidth : panelWidth],
  });

  return (
    <Portal>
      <View style={styles.layer} pointerEvents="box-none">
        {modal ? <SheetBackdrop onClick={dismissible ? onClose : undefined} /> : null}
        <Animated.View
          accessibilityViewIsModal={modal}
          onLayout={onLayout}
          style={[
            styles.panel,
            side === 'left' ? styles.left : styles.right,
            { maxWidth: width, transform: [{ translateX: slide }] },
            style,
          ]}
        >
          <PanelHeader
            leading={leading}
            onClose={onClose}
            overline={overline}
            pad={pad}
            scrolled={scrolled}
            showClose={showClose}
            subtitle={subtitle}
            title={title}
          />

          {meta === null ? null : (
            <View style={{ paddingHorizontal: pad, paddingBottom: theme.spacing['sp-2'] }}>
              {meta}
            </View>
          )}

          <ScrollView
            onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > 2)}
            scrollEventThrottle={16}
            style={styles.body}
            contentContainerStyle={{
              paddingTop: theme.spacing['sp-1'],
              paddingHorizontal: pad,
              paddingBottom: footer === null ? pad : theme.spacing['sp-2'],
            }}
          >
            <OverlayBody
              emptyAction={emptyAction}
              emptyMessage={emptyMessage}
              emptyTitle={emptyTitle}
              errorMessage={errorMessage}
              errorTitle={errorTitle}
              onRetry={onRetry}
              skeleton={<PanelSkeleton />}
              state={state}
              unavailableAction={unavailableAction}
              unavailableMessage={unavailableMessage}
              unavailableStyle={styles.unavailable}
              unavailableTitle={unavailableTitle}
              variant="panel"
            >
              {children}
            </OverlayBody>
          </ScrollView>

          {footer === null ? null : (
            <View
              style={{
                flexShrink: 0,
                paddingTop: theme.spacing['sp-3'],
                paddingHorizontal: pad,
                paddingBottom: pad,
              }}
            >
              {footer}
            </View>
          )}
        </Animated.View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: theme.colors['surface-form'],
    ...theme.elevation.e5,
  },
  right: { right: 0 },
  left: { left: 0 },
  body: { flexGrow: 1, flexShrink: 1 },
  unavailable: { paddingTop: theme.spacing['sp-4'], paddingBottom: theme.spacing['sp-6'] },
});
