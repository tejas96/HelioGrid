import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';

/**
 * Money's adornment: the market's currency symbol (`useFormat`, the pack's own), shown always — an
 * empty price field read as any number — on the side the market writes it. The field's name says
 * what it holds, so a screen reader skips the mark.
 */
export function CurrencyMark({ side }: { side: 'before' | 'after' }) {
  const { currencySymbol, symbolPosition } = useFormat();
  if (symbolPosition !== side) return null;
  return (
    <View
      style={side === 'before' ? styles.currencyBefore : styles.currencyAfter}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text variant="mono" color="secondary">
        {currencySymbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Money's currency symbol, as the web's: mono and quiet, a hairline between it and the amount. */
  currencyBefore: {
    marginRight: theme.spacing['sp-3'],
    paddingRight: theme.spacing['sp-3'],
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors['line-soft'],
  },
  currencyAfter: {
    marginLeft: theme.spacing['sp-3'],
    paddingLeft: theme.spacing['sp-3'],
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors['line-soft'],
  },
});
