import { theme } from '@heliogrid/theme';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';

/**
 * Sheet and DetailPanel pull the button back by 8/10; Modal's roomier header by 10/12. Under a
 * handle the header has no top padding, so `handle` pulls only sideways: pulled up, 8 of the 44
 * lie outside the header, and a phone takes no touch outside a view's parent.
 */
export type OverlayCloseOffset = 'sheet' | 'modal' | 'handle';

interface OverlayCloseProps {
  onClick?: () => void;
  offset?: OverlayCloseOffset;
  /**
   * The accessible name. Hardcoded "Close" in the reference implementation and no prop on any of
   * the three public contracts carries it, so the default stays here rather than becoming an API
   * this family's `.d.ts` files do not declare.
   */
  label?: string;
}

/**
 * The 44×44 dismissal shared by Sheet, Modal and DetailPanel — through the Pressable primitive,
 * which owns that floor. The web half's hover tint has no touch equivalent; Pressable's pressed
 * state is the feedback a finger gets instead.
 */
export function OverlayClose({ onClick, offset = 'sheet', label = 'Close' }: OverlayCloseProps) {
  return (
    <Pressable accessibilityLabel={label} onPress={onClick} style={[styles.button, OFFSET[offset]]}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 6 6 18M6 6l12 12"
          stroke={theme.colors['text-secondary']}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

/* The negative pulls have no spacing token — they are the correction that keeps the 44px target
   from growing the header, and they mirror the reference's own -8/-10 and -10/-12. */
const OFFSET: Record<OverlayCloseOffset, ViewStyle> = {
  sheet: { marginTop: -8, marginRight: -10 },
  modal: { marginTop: -10, marginRight: -12 },
  handle: { marginRight: -10 },
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
  },
});
