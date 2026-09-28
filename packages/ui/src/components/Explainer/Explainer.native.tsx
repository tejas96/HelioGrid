import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, BackHandler, findNodeHandle, StyleSheet, View } from 'react-native';
import { Portal } from '../../primitives/Portal/Portal.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { explainerGeometry } from './Explainer.logic';
import type { ExplainerProps } from './Explainer.types';
import { ExplainerBubble } from './ExplainerBubble.native';
import { InfoGlyph } from './ExplainerParts.native';
import { useExplainer } from './use-explainer';
import { useExplainerPlace } from './use-explainer-place.native';

type NativeExplainerProps = ExplainerProps & {
  style?: StyleProp<ViewStyle>;
};

function focusOn(view: View | null) {
  const tag = findNodeHandle(view);
  if (tag !== null) AccessibilityInfo.setAccessibilityFocus(tag);
}

/**
 * The ask (`F7-46`), the same object as the web half — a bubble anchored to its "i", never a sheet.
 *
 * WEB BEHAVIOURS MAPPED FOR TOUCH:
 * · Hover has no touch equivalent; the `hover` prop is not read here, and tap is the way in.
 * · The document's outside-tap listener becomes a transparent catcher over the window, as `Menu`'s
 *   scrim is. React Native has no window scroll event, so a scroll that starts outside the bubble
 *   closes it as an outside touch.
 * · Escape is the Android back button and VoiceOver's escape gesture. DOM focus is the screen reader's: it moves into the bubble
 *   on a tap and back to the trigger on closing; iOS hears each new page announced.
 * · `position: absolute` beside the trigger becomes `measureInWindow` plus the `Portal`, so nothing
 *   above the ask can clip it; `within` is measured the same way.
 */
export function Explainer(props: NativeExplainerProps) {
  const { label, density = 'expressive', inset = false, glyph } = props;
  const ask = useExplainer(props);
  const trigger = useRef<View>(null);
  const bubble = useRef<View>(null);
  const geometry = explainerGeometry(density);
  const { placed, cap, onLayout } = useExplainerPlace({
    isOpen: ask.isOpen,
    content: ask.content,
    trigger,
    within: props.within,
    placement: props.placement ?? 'bottom',
    density,
    maxWidth: props.maxWidth,
  });

  const close = (reason: 'trigger' | 'outside' | 'escape') => {
    ask.hide(reason);
    focusOn(trigger.current);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: listens only while open; `close` is rebuilt every render.
  useEffect(() => {
    if (!ask.isOpen) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      close('escape');
      return true;
    });
    return () => back.remove();
  }, [ask.isOpen]);

  const isPlaced = placed !== null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: moves the reader in once, as the bubble lands; `openedBy` is a ref.
  useEffect(() => {
    if (isPlaced && ask.openedBy.current === 'trigger') focusOn(bubble.current);
  }, [isPlaced]);

  const position = ask.pager?.position;
  const spoken = typeof ask.content === 'string' ? ask.content : undefined;
  useEffect(() => {
    if (position !== undefined) {
      AccessibilityInfo.announceForAccessibility(
        spoken === undefined ? position : `${spoken} ${position}`,
      );
    }
  }, [position, spoken]);

  if (ask.empty) return null;
  return (
    <View ref={trigger} collapsable={false} style={[styles.wrap, props.style]}>
      <Pressable
        accessibilityLabel={label}
        accessibilityState={{ expanded: ask.isOpen }}
        onPress={() => (ask.isOpen ? close('trigger') : ask.show('trigger'))}
        style={[
          styles.trigger,
          ask.isOpen ? styles.triggerOpen : undefined,
          inset ? { margin: -(44 - geometry.visual) / 2 } : undefined,
        ]}
      >
        {glyph ?? (
          <InfoGlyph
            size={geometry.glyph}
            color={ask.isOpen ? theme.colors.accent : theme.colors['text-secondary']}
          />
        )}
      </Pressable>
      {ask.isOpen ? (
        <Portal>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onTouchStart={() => close('outside')}
            style={styles.catcher}
          />
          <ExplainerBubble
            bubbleRef={bubble}
            label={label}
            title={props.title}
            density={density}
            placed={placed}
            cap={cap}
            onLayout={onLayout}
            content={ask.content}
            pager={ask.pager}
            action={props.action}
            showsAction={ask.showsAction}
            onMove={ask.move}
            onEscape={() => close('escape')}
          />
        </Portal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  trigger: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
  triggerOpen: { backgroundColor: theme.colors['accent-subtle'] },
  catcher: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
