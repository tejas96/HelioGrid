import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { stackedBanners } from './Banner.logic';
import type { BannerStackProps } from './Banner.types';

interface NativeBannerStackProps extends BannerStackProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * `mode="stack"` shows every fact (capped by `max`); `mode="single"` applies the precedence rule —
 * the broadest true fact speaks.
 *
 * NEITHER MECHANISM MAY HIDE A MANDATORY BANNER. Every NEVER_DISMISSIBLE banner renders, in
 * precedence order, and the cap applies to the REST.
 */
export function BannerStack({
  children,
  mode = 'stack',
  max = 3,
  gap = 8,
  moreLabel,
  style,
}: NativeBannerStackProps) {
  const { shown, hidden, saysMore } = stackedBanners(children, mode, max);
  if (shown.length === 0) {
    return null;
  }
  return (
    <View style={[styles.root, { gap }, style]}>
      {shown}
      {saysMore ? (
        <Text variant="caption" color="tertiary" style={styles.more}>
          {moreLabel(hidden)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  more: {
    paddingLeft: 4,
  },
});
