import type { ReactNode } from 'react';
import { useState } from 'react';
import type { Animated, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { KeyboardFrame } from '../../primitives/Keyboard/KeyboardFrame.native';
import { SheetFade } from './SheetFade.native';
import { SheetHeaderSlot, type SheetHeaderSlotProps } from './SheetHeader.native';

interface SheetScrollBodyProps {
  /** How the body takes the panel's room: hugging its content, or filling a fixed height. */
  flex: ViewStyle;
  /** The header to lay over the body's top when its title tucks; the body pads itself by its height. */
  lifted?: SheetHeaderSlotProps;
  tuck: Animated.Value;
  onScrollOffset: (top: number) => void;
  contentContainerStyle: StyleProp<ViewStyle>;
  foot?: ReactNode;
  children: ReactNode;
}

/**
 * The sheet's scrolling body, with the fade its rows pass under and — when the title tucks — the
 * header lying over its top. The panel itself rises over the keyboard, so the frame only keeps the
 * focused field and its line above the footer.
 */
export function SheetScrollBody({
  flex,
  lifted,
  tuck,
  onScrollOffset,
  contentContainerStyle,
  foot,
  children,
}: SheetScrollBodyProps) {
  const [lift, setLift] = useState(0);
  return (
    <View style={flex}>
      {/* The fade and the lifted header come after the scroll view: the native scroll view draws
          over an earlier sibling whatever its zIndex, and the fade went unseen. */}
      <KeyboardFrame
        rises
        style={flex}
        onScrollOffset={onScrollOffset}
        contentContainerStyle={[
          contentContainerStyle,
          lifted === undefined ? undefined : { paddingTop: lift },
        ]}
        foot={foot}
      >
        <View style={styles.fill}>{children}</View>
      </KeyboardFrame>
      <SheetFade tuck={tuck} />
      {lifted === undefined ? null : <SheetHeaderSlot {...lifted} onLift={setLift} tuck={tuck} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1, flexShrink: 1 },
});
