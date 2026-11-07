import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { AmbientSky } from '../AmbientSky/AmbientSky.native';
import { BrandBloom } from '../BrandBloom/BrandBloom.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import type { SuccessDwellProps } from './SuccessDwell.types';

interface NativeSuccessDwellProps extends SuccessDwellProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The beat after the code is accepted — the sun rising in the door's light: on a bad connection
 * this is the only thing saying it worked.
 */
export function SuccessDwell({ title, line, style }: NativeSuccessDwellProps) {
  return (
    <View style={[styles.dwell, style]}>
      <AmbientSky strength="door" />
      <BrandBloom placement="centre" />
      <LottieMoment name="sunrise" size={120} />
      <View style={styles.words}>
        <Text variant="display">{title}</Text>
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
    backgroundColor: colors.canvas,
  },
  words: { alignItems: 'center', gap: theme.spacing['sp-2'] },
});
