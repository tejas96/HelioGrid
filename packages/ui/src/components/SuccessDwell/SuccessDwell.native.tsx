import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Text } from '../../primitives/Text/Text.native';
import { BrandBloom } from '../BrandBloom/BrandBloom.native';
import type { SuccessDwellProps } from './SuccessDwell.types';

interface NativeSuccessDwellProps extends SuccessDwellProps {
  style?: StyleProp<ViewStyle>;
}

/** The beat after the code is accepted: on a bad connection this is the only thing saying it worked. */
export function SuccessDwell({ title, line, style }: NativeSuccessDwellProps) {
  return (
    <View style={[styles.dwell, style]}>
      <BrandBloom placement="centre" />
      <View style={styles.mark}>
        <Icon size="lg">
          <Svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors['success-text']}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M20 6 9 17l-5-5" />
          </Svg>
        </Icon>
      </View>
      <View style={styles.words}>
        <Text variant="h2">{title}</Text>
        <Text variant="body" color="secondary" align="center">
          {line}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dwell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-6'],
    backgroundColor: theme.colors.canvas,
  },
  mark: {
    width: theme.spacing['sp-20'],
    height: theme.spacing['sp-20'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['success-bg'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { alignItems: 'center', gap: theme.spacing['sp-2'] },
});
