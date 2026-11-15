import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { PanResponderInstance } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';

interface SheetHandleProps {
  /** With a header below it the handle takes the roomier bottom padding. */
  hasHeader: boolean;
  /** The drag recogniser. Its handlers are spread onto the bar, which IS the drag target. */
  pan: PanResponderInstance;
  /** The sheet's close, spoken: the phone draws no ✕, so a screen reader closes it here. */
  closeLabel: TranslatedText;
  onClose?: () => void;
  /** The title the header tucks into this row once the body scrolls, and how far it has come. */
  tucked?: TuckedTitle;
}

export interface TuckedTitle {
  title: string;
  tuck: Animated.Value;
}

/**
 * The 40×5 grab bar: the drag target, and the sheet's close for a screen reader — the phone has no
 * ✕, since a drag, a tap outside and Back all close it. A sheet that must be answered (no
 * `onClose`) offers no close here either. Once the body scrolls, the title rests in this row.
 */
export function SheetHandle({ hasHeader, pan, closeLabel, onClose, tucked }: SheetHandleProps) {
  const closes = onClose !== undefined;
  return (
    <View
      {...pan.panHandlers}
      accessible={closes}
      accessibilityRole={closes ? 'button' : undefined}
      accessibilityLabel={closes ? closeLabel : undefined}
      onAccessibilityTap={onClose}
      style={[
        styles.handle,
        hasHeader ? styles.handleWithHeader : undefined,
        tucked === undefined ? undefined : styles.handleTucks,
      ]}
    >
      <View style={styles.handleBar} />
      {tucked === undefined ? null : (
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[
            styles.mini,
            {
              opacity: tucked.tuck,
              transform: [
                {
                  translateY: tucked.tuck.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }),
                },
              ],
            },
          ]}
        >
          <Text variant="h4" align="center" fixedSize>
            {tucked.title}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingTop: theme.spacing['sp-5'],
    paddingBottom: 6,
    flexShrink: 0,
  },
  handleWithHeader: { paddingBottom: theme.spacing['sp-5'] },
  /* Room under the bar for the tucked title: the bar keeps its place, the title sits below it.
     10 has no spacing token — the sheet's own functional top padding. */
  handleTucks: {
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: theme.spacing['sp-8'],
  },
  /* The strong line, as the web's: the sunken colour all but vanished on the sheet. */
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['line-strong'],
  },
  mini: {
    position: 'absolute',
    top: theme.spacing['sp-6'],
    left: theme.spacing['sp-12'],
    right: theme.spacing['sp-12'],
  },
});
