import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import type { KeyboardFrameProps } from './Keyboard.types';
import { useKeyboardHeight } from './use-keyboard.native';

interface NativeKeyboardFrameProps extends KeyboardFrameProps {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Room kept under the focused field's text box: the rest of its well, the gap and its hint or error
 * line, two lines in Hindi, all of which the text box does not count. Measured on the iPhone, one
 * line ends about 43 points under the text box (`SCR-M01-18` AC-19).
 */
const ROOM_UNDER_FIELD = theme.spacing['sp-16'];

/**
 * The library measures the keyboard the same way on iOS and Android (edge to edge included), so
 * the focused field, its line and the foot land in the same place on both phones.
 */
export function KeyboardFrame({
  children,
  foot,
  onFootHeight,
  footBandUnderKeyboard = 0,
  scrolls = true,
  rises = false,
  onScrollOffset,
  heldChild,
  style,
  contentContainerStyle,
}: NativeKeyboardFrameProps) {
  const [footHeight, setFootHeight] = useState(0);
  const keyboardHeight = useKeyboardHeight();
  const measureFoot = (event: LayoutChangeEvent) => {
    setFootHeight(event.nativeEvent.layout.height);
    onFootHeight?.(event.nativeEvent.layout.height);
  };
  if (!scrolls) {
    return (
      <KeyboardAvoidingView behavior="padding" style={[styles.fill, style]}>
        <View style={[styles.fill, contentContainerStyle]}>{children}</View>
        {foot === undefined ? null : <View onLayout={measureFoot}>{foot}</View>}
      </KeyboardAvoidingView>
    );
  }
  return (
    <View style={style ?? styles.fill}>
      <KeyboardAwareScrollView
        style={styles.scroll}
        /* The foot's height counts only while it shows, less its band, which the keyboard covers. */
        bottomOffset={
          ROOM_UNDER_FIELD + (foot === undefined ? 0 : footHeight - footBandUnderKeyboard)
        }
        /* Risen above the keyboard already, the content needs no room for it under its end. */
        extraKeyboardSpace={rises ? -keyboardHeight : 0}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        stickyHeaderIndices={heldChild === undefined ? undefined : [heldChild]}
        onScroll={
          onScrollOffset === undefined
            ? undefined
            : (event) => onScrollOffset(event.nativeEvent.contentOffset.y)
        }
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </KeyboardAwareScrollView>
      {foot === undefined ? null : rises ? (
        <View onLayout={measureFoot}>{foot}</View>
      ) : (
        <KeyboardStickyView offset={{ opened: footBandUnderKeyboard }} onLayout={measureFoot}>
          {foot}
        </KeyboardStickyView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* Its content's height, shrunk to the room it is given: a short sheet stays short, a page fills. */
  scroll: { flexGrow: 1, flexShrink: 1 },
});
