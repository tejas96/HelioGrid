import type { ReactElement } from 'react';
import { Children, isValidElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { bannerRank, isNeverDismissible } from './Banner.kinds';
import type { BannerProps, BannerStackProps } from './Banner.types';

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
  style,
}: NativeBannerStackProps) {
  const items = Children.toArray(children).filter((child): child is ReactElement<BannerProps> =>
    isValidElement<BannerProps>(child),
  );
  const ordered = [...items].sort((a, b) => bannerRank(a.props.kind) - bannerRank(b.props.kind));
  const mandatory = ordered.filter((el) => isNeverDismissible(el.props.kind));
  const rest = ordered.filter((el) => !isNeverDismissible(el.props.kind));
  const room =
    mode === 'single' ? (mandatory.length > 0 ? 0 : 1) : Math.max(0, max - mandatory.length);
  const shown = [...mandatory, ...rest.slice(0, room)].sort(
    (a, b) => bannerRank(a.props.kind) - bannerRank(b.props.kind),
  );
  const hidden = ordered.length - shown.length;
  if (shown.length === 0) {
    return null;
  }
  return (
    <View style={[styles.root, { gap }, style]}>
      {shown}
      {mode === 'stack' && hidden > 0 ? (
        <Text variant="caption" color="tertiary" style={styles.more}>
          {`${hidden} more ${hidden === 1 ? 'notice' : 'notices'} on this screen`}
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
