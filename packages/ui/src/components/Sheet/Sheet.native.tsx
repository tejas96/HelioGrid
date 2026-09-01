import { theme } from '@heliogrid/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { Portal } from '../../primitives/Portal/Portal.native';
import { OverlayBody } from './OverlayBody.native';
import type { SheetDensity, SheetProps, SheetSize } from './Sheet.types';
import { SheetBackdrop } from './SheetBackdrop.native';
import { SheetHandle } from './SheetHandle.native';
import { SheetHeader } from './SheetHeader.native';
import { SheetSkeleton } from './SheetSkeleton.native';

interface NativeSheetProps extends SheetProps {
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
}

/** Past this many dp of downward drag the sheet closes instead of springing back. */
const DRAG_DISMISS = 96;

/**
 * Bottom sheet — the system's primary overlay. Springs from the bottom edge, 32dp top radius
 * (16dp functional), e5. The backdrop fades the layer behind toward white, never a dark scrim.
 *
 * THREE WEB BEHAVIOURS MAPPED FOR TOUCH:
 * · `position: fixed` has no RN equivalent, so the whole layer renders through the Portal
 *   primitive — the one thing in the system that lifts a surface out of its screen.
 * · The Esc key and the DOM focus trap have no touch equivalents. Dismissal is the backdrop tap,
 *   the 44×44 close button and the drag past 96dp; the trap becomes `accessibilityViewIsModal`,
 *   which is what hides the layer behind from a screen reader.
 * · The body scroll lock is inherent: a modal sheet's layer covers the screen. A non-modal one
 *   sets `pointerEvents="box-none"` so the surface behind stays live and scrollable — the same
 *   three-things-together decision the web half makes.
 */
export function Sheet({
  open = true,
  onClose,
  title,
  subtitle,
  overline,
  children,
  size = 'auto',
  density = 'expressive',
  handle = true,
  showClose = false,
  dismissible = true,
  dragToDismiss = true,
  modal = true,
  footer = null,
  state = 'ready',
  errorTitle = "Couldn't load this",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  emptyAction = null,
  unavailableTitle,
  unavailableMessage,
  unavailableAction = null,
  style,
  bodyStyle,
}: NativeSheetProps) {
  const offset = useRef(new Animated.Value(0)).current;
  const scrollTop = useRef(0);
  const [panelHeight, setPanelHeight] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const draggable = dragToDismiss && dismissible;

  useEffect(() => {
    if (!open || panelHeight === 0) {
      return;
    }
    offset.setValue(panelHeight);
    const entry = Animated.timing(offset, {
      toValue: 0,
      duration: theme.motion.durations.emphasised,
      easing: Easing.bezier(...theme.motion.easings.spring),
      useNativeDriver: true,
    });
    entry.start();
    return () => entry.stop();
  }, [open, panelHeight, offset]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          draggable && gesture.dy > 4 && scrollTop.current <= 0,
        onPanResponderMove: (_event, gesture) => {
          if (gesture.dy > 0) {
            offset.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > DRAG_DISMISS && onClose !== undefined) {
            onClose();
            return;
          }
          Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [draggable, onClose, offset],
  );

  if (!open) {
    return null;
  }

  const ladder = DENSITY[density];
  const hasHeader = title !== undefined || overline !== undefined || showClose;
  const onLayout = (event: LayoutChangeEvent) => setPanelHeight(event.nativeEvent.layout.height);

  return (
    <Portal>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {modal ? <SheetBackdrop onClick={dismissible ? onClose : undefined} /> : null}
        <Animated.View
          accessibilityViewIsModal={modal}
          accessibilityRole={modal ? 'alert' : 'none'}
          onLayout={onLayout}
          style={[
            styles.panel,
            ladder.panel,
            SIZE[size],
            { transform: [{ translateY: offset }] },
            style,
          ]}
        >
          {handle ? <SheetHandle hasHeader={hasHeader} pan={pan} /> : null}

          {hasHeader ? (
            <View {...(handle ? {} : pan.panHandlers)}>
              <SheetHeader
                density={density}
                handle={handle}
                onClose={onClose}
                overline={overline}
                scrolled={scrolled}
                showClose={showClose}
                subtitle={subtitle}
                title={title}
              />
            </View>
          ) : null}

          <ScrollView
            onScroll={(event) => {
              scrollTop.current = event.nativeEvent.contentOffset.y;
              setScrolled(event.nativeEvent.contentOffset.y > 2);
            }}
            scrollEventThrottle={16}
            style={BODY_FLEX[size]}
            contentContainerStyle={[
              ladder.bodyPad,
              hasHeader ? styles.bodyNoTop : undefined,
              footer === null ? undefined : styles.bodyWithFooter,
              bodyStyle,
            ]}
          >
            <OverlayBody
              emptyAction={emptyAction}
              emptyMessage={emptyMessage}
              emptyTitle={emptyTitle}
              errorMessage={errorMessage}
              errorTitle={errorTitle}
              onRetry={onRetry}
              skeleton={<SheetSkeleton density={density} />}
              state={state}
              unavailableAction={unavailableAction}
              unavailableMessage={unavailableMessage}
              unavailableStyle={styles.unavailable}
              unavailableTitle={unavailableTitle}
              variant="sheet"
            >
              {children}
            </OverlayBody>
          </ScrollView>

          {footer === null ? null : <View style={[styles.footer, ladder.footerPad]}>{footer}</View>}
        </Animated.View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '92%',
    backgroundColor: theme.colors['surface-form'],
    ...theme.elevation.e5,
  },
  panelExpressive: {
    borderTopLeftRadius: theme.radius['r-sheet-top'],
    borderTopRightRadius: theme.radius['r-sheet-top'],
  },
  panelFunctional: {
    borderTopLeftRadius: theme.radius['rf-xl'],
    borderTopRightRadius: theme.radius['rf-xl'],
  },
  auto: {},
  half: { height: '56%' },
  full: { height: '92%' },
  bodyAuto: { flexGrow: 0, flexShrink: 1 },
  bodyFill: { flexGrow: 1, flexShrink: 1 },
  bodyPadExpressive: {
    paddingTop: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-5'],
    paddingBottom: theme.spacing['sp-6'],
  },
  bodyPadFunctional: {
    paddingTop: 10,
    paddingHorizontal: theme.spacing['sp-4'],
    paddingBottom: theme.spacing['sp-4'],
  },
  bodyNoTop: { paddingTop: 0 },
  bodyWithFooter: { paddingBottom: theme.spacing['sp-2'] },
  unavailable: {
    paddingTop: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-5'],
  },
  /* The web half fades the footer in with a luminance gradient. RN has no CSS gradient, and a
     divider line is the one thing this family may not draw — so the footer takes the same
     --surface-form as the body and only padding separates them. */
  footer: {
    flexShrink: 0,
    paddingTop: theme.spacing['sp-3'],
    backgroundColor: theme.colors['surface-form'],
  },
  footerExpressive: {
    paddingHorizontal: theme.spacing['sp-5'],
    paddingBottom: theme.spacing['sp-6'],
  },
  footerFunctional: {
    paddingHorizontal: theme.spacing['sp-4'],
    paddingBottom: theme.spacing['sp-4'],
  },
});

interface SheetLadder {
  panel: ViewStyle;
  bodyPad: ViewStyle;
  footerPad: ViewStyle;
}

/** The density ladder as a lookup, the way the reference spells it — never a chain of branches. */
const DENSITY: Record<SheetDensity, SheetLadder> = {
  expressive: {
    panel: styles.panelExpressive,
    bodyPad: styles.bodyPadExpressive,
    footerPad: styles.footerExpressive,
  },
  functional: {
    panel: styles.panelFunctional,
    bodyPad: styles.bodyPadFunctional,
    footerPad: styles.footerFunctional,
  },
};

/** auto hugs its content (max 92%); half is 56%; full is 92%. */
const SIZE: Record<SheetSize, ViewStyle> = {
  auto: styles.auto,
  half: styles.half,
  full: styles.full,
};

/** `auto` lets the body shrink to its content; the two fixed heights make it fill instead. */
const BODY_FLEX: Record<SheetSize, ViewStyle> = {
  auto: styles.bodyAuto,
  half: styles.bodyFill,
  full: styles.bodyFill,
};
