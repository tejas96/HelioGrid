import { PRICE_BOOK_RATE_BASES, type PriceBookRateBasis } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { RetryButton } from '../Button/RetryButton.native';
import { CatalogStripBar } from '../CatalogItems/CatalogStrip';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider/market-context';
import type { CatalogRate, CatalogRatesProps } from './CatalogRates.types';

/**
 * Catalog settings' Rates panel on the phone: the price book's strip, then its rates grouped by
 * how each is charged — or, before the first version, the teaching with its first act.
 */
export function CatalogRates({ words, read, strip, rates, onAddFirst }: CatalogRatesProps) {
  /* *Try again* leaves with the failure: the screen reader goes to the panel, which stays while it
     reloads. */
  const panel = useRef<View>(null);
  if (read.kind === 'loading') {
    return (
      <View ref={panel} style={styles.panel}>
        <LoadingBars label={words.loading} bars={['row', 'panel']} />
      </View>
    );
  }
  if (read.kind === 'failed') {
    return (
      <View ref={panel} style={styles.panel}>
        <EmptyState
          title={words.loadFailed}
          action={
            <RetryButton size="lg" onRetry={read.retry} label={words.tryAgain} focusAfter={panel} />
          }
        />
      </View>
    );
  }
  return (
    <View ref={panel} style={styles.panel}>
      <CatalogStripBar strip={strip} />
      {rates.length === 0 ? (
        <EmptyState
          glow={false}
          icon={<ShellGlyph name="document" size="lg" tone="secondary" />}
          title={words.noRates}
          description={words.noRatesBody}
          action={
            onAddFirst === null ? undefined : (
              <Button variant="secondary" size="sm" onClick={onAddFirst}>
                {words.addFirstRate}
              </Button>
            )
          }
          style={[tileSurface, styles.empty]}
        />
      ) : (
        <RateGroups rates={rates} bases={words.bases} />
      )}
    </View>
  );
}

/**
 * Rates grouped by how each is charged, in the market's order of bases: an overline with the
 * group's count, then one row per rate — its name and its amount in the mono face (`F7-09`).
 * A basis with no rate draws no group.
 */
export function RateGroups({
  rates,
  bases,
}: {
  rates: readonly CatalogRate[];
  bases: Readonly<Record<PriceBookRateBasis, string>>;
}) {
  const format = useFormat();
  return (
    <View style={styles.groups}>
      {PRICE_BOOK_RATE_BASES.map((basis) => {
        const group = rates.filter((rate) => rate.basis === basis);
        if (group.length === 0) return null;
        return (
          <View key={basis} style={styles.group}>
            <View style={styles.groupHead}>
              <Text variant="overline" color="secondary">
                {bases[basis]}
              </Text>
              <Text variant="caption" color="secondary">
                {format.number(group.length)}
              </Text>
            </View>
            <View style={[tileSurface, styles.card]}>
              {group.map((rate) => (
                <View key={rate.key} style={styles.row}>
                  <Text variant="body-sm" style={styles.name}>
                    {rate.name}
                  </Text>
                  <Text variant="mono" bold>
                    {format.money(rate.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: theme.spacing['sp-3'] },
  empty: {
    borderRadius: theme.radius['r-md'],
    paddingVertical: theme.spacing['sp-8'],
    paddingHorizontal: theme.spacing['sp-5'],
  },
  groups: { gap: theme.spacing['sp-4'] },
  group: { gap: theme.spacing['sp-2'] },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['sp-2'] },
  card: { borderRadius: theme.radius['r-md'], paddingVertical: theme.spacing['sp-0-5'] },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.layout['tile-gap'],
    paddingVertical: theme.layout['tile-gap'],
    paddingHorizontal: theme.spacing['sp-3'],
  },
  name: { flex: 1, minWidth: 0 },
});
