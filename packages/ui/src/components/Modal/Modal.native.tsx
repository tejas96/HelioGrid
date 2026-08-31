import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { Portal } from '../../primitives/Portal/Portal.native';
import { Text } from '../../primitives/Text/Text.native';
import { OverlayClose } from '../Sheet/OverlayClose.native';
import { SheetBackdrop } from '../Sheet/SheetBackdrop.native';
import type { ModalDensity, ModalProps, ModalSize } from './Modal.types';
import { ModalMark } from './ModalMark.native';

interface NativeModalProps extends ModalProps {
  style?: StyleProp<ViewStyle>;
}

/** sm 400 · md 520 · lg 720, each capped at the layer's own width. */
const WIDTH: Record<ModalSize, number> = { sm: 400, md: 520, lg: 720 };

/** 1.3 line-height on the reference's 20/18 title sizes; RN takes points, not a ratio. */
const TITLE: Record<ModalDensity, TextStyle> = {
  expressive: { fontWeight: '700', letterSpacing: -0.4, lineHeight: 26 },
  functional: { fontSize: 18, fontWeight: '700', letterSpacing: -0.36, lineHeight: 23 },
};

/**
 * Centred dialog for decisions. Springs in with a 12dp rise and a 0.97 scale over the same
 * white-fading backdrop as `Sheet`. It is the **desktop** form; the phone answer is a `Sheet`,
 * and `EditorSurface` is what performs that switch — mount this directly only where you own it.
 *
 * **There is deliberately no `modal={false}` here.** A decision that must be answered cannot have
 * a live surface behind it, so this is always `accessibilityViewIsModal` and always backdropped.
 *
 * TWO WEB BEHAVIOURS MAPPED FOR TOUCH: `position: fixed` becomes the Portal primitive, and the Esc
 * key and DOM focus trap become the backdrop tap plus `accessibilityViewIsModal`.
 */
export function Modal({
  open = true,
  onClose,
  title,
  description,
  overline,
  children,
  size = 'md',
  density = 'expressive',
  tone = 'neutral',
  icon,
  footer = null,
  showClose = true,
  dismissible = true,
  style,
}: NativeModalProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!open) {
      return;
    }
    enter.setValue(0);
    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: theme.motion.durations.emphasised,
      easing: Easing.bezier(...theme.motion.easings.spring),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [open, enter]);

  if (!open) {
    return null;
  }

  const roomy = children !== undefined || description !== undefined;
  const pad = density === 'functional' ? theme.spacing['sp-6'] : 28;

  return (
    <Portal>
      <View style={styles.layer} pointerEvents="box-none">
        <SheetBackdrop onClick={dismissible ? onClose : undefined} />
        {/* NO `accessibilityRole` HERE, AND `alert` WAS THE WRONG ONE. The web half is
            `role="dialog"`, and ARIA's `dialog` has no React Native partner at all — RN's role
            vocabulary has no dialog word, which is the sanctioned gap (check h, NO_RN_ROLE), and
            `DetailPanel.native` already answers it this way. `alert` is not that partner: it means
            "urgent text, announce it now", so a standing decision panel with a header, a body and a
            footer was being announced as one interruption. `accessibilityViewIsModal` is what
            actually carries the modality — it is the focus trap, which is the whole of what
            `aria-modal` buys on the other half. */}
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            density === 'functional' ? styles.panelFunctional : styles.panelExpressive,
            { maxWidth: WIDTH[size] },
            {
              opacity: enter,
              transform: [
                { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
              ],
            },
            style,
          ]}
        >
          <View style={[styles.header, { paddingTop: pad, paddingHorizontal: pad }]}>
            <ModalMark icon={icon} tone={tone} />
            <View style={styles.heading}>
              {overline === undefined ? null : (
                <Text variant="overline" color="tertiary" style={styles.overline}>
                  {overline}
                </Text>
              )}
              {title === undefined ? null : (
                <Text variant="h3" style={TITLE[density]}>
                  {title}
                </Text>
              )}
              {description === undefined ? null : (
                <Text color="secondary" style={descriptionStyle}>
                  {description}
                </Text>
              )}
            </View>
            {showClose ? <OverlayClose offset="modal" onClick={onClose} /> : null}
          </View>

          {children === undefined ? null : (
            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingTop: theme.spacing['sp-4'], paddingHorizontal: pad }}
            >
              {children}
            </ScrollView>
          )}

          {footer === null ? null : (
            <View
              style={{
                flexShrink: 0,
                paddingTop: roomy ? theme.spacing['sp-5'] : theme.spacing['sp-4'],
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

/* 14px and 1.55 of it in points — neither has a type token, and both come from the reference. */
const descriptionStyle: TextStyle = { marginTop: 6, fontSize: 14, lineHeight: 22 };

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['sp-5'],
  },
  panel: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: theme.colors['surface-form'],
    ...theme.elevation.e5,
  },
  panelExpressive: { borderRadius: theme.radius['r-xl'] },
  panelFunctional: { borderRadius: theme.radius['rf-xl'] },
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heading: { flex: 1, minWidth: 0 },
  overline: { marginBottom: 6 },
  body: { flexShrink: 1 },
});
