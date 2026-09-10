import { theme } from '@heliogrid/theme';
import { BrandBloom, Icon, Text } from '@heliogrid/ui';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { styles } from '../styles';

/**
 * The 1.2 s beat after the code is accepted (`DONE_DWELL_MS`): on a bad connection this is the
 * only thing saying it worked, so it is drawn, and it names where the person is going.
 */
export function SuccessDwell({ title, line }: { title: string; line: string }) {
  return (
    <View style={styles.dwell}>
      <BrandBloom placement="centre" />
      <View style={styles.dwellMark}>
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
      <View style={styles.dwellWords}>
        <Text variant="h2">{title}</Text>
        <Text variant="body" color="secondary" align="center">
          {line}
        </Text>
      </View>
    </View>
  );
}
