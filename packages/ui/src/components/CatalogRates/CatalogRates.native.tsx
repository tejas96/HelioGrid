import { PRICE_BOOK_RATE_BASES, type PriceBookRateBasis } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { RetryButton } from '../Button/RetryButton.native';
import { Card } from '../Card/Card.native';
import { CatalogStripBar } from '../CatalogItems/CatalogStrip';
import { Chip } from '../Chip/Chip.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider/market-context';
import { SearchField } from '../SearchField/SearchField.native';
import { basesToggled, matchingRates } from './CatalogRates.logic';
import type { CatalogRate, CatalogRatesProps } from './CatalogRates.types';

// web-only part: DataTable — the table is the web wide room; the phone lists the rates in groups.

/**
 * Catalog settings' Rates panel on the phone: the price book's strip, then *Search rates* and the
 * charge chips over its rates grouped by how each is charged — or, before the first version, the teaching with its first act.
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
          scene="settle"
          title={words.noRates}
          description={words.noRatesBody}
          action={
            onAddFirst === null ? undefined : (
              <Button
                variant="primary"
                size="md"
                icon={<ShellGlyph name="plus" size="sm" tone="inverse" />}
                onClick={onAddFirst}
              >
                {words.addFirstRate}
              </Button>
            )
          }
        />
      ) : (
        <RatesFound words={words} rates={rates} />
      )}
    </View>
  );
}

/**
 * *Search rates* and the charge chips — the web's at every width — over the groups they leave, or
 * the line that nothing matches.
 */
function RatesFound({ words, rates }: Pick<CatalogRatesProps, 'words' | 'rates'>) {
  const [query, setQuery] = useState('');
  const [bases, setBases] = useState<PriceBookRateBasis[]>([]);
  const found = matchingRates(rates, query, bases);
  return (
    <>
      <SearchField
        placeholder={words.searchRates}
        ariaLabel={words.searchRates}
        value={query}
        onChange={setQuery}
        onClear={() => setQuery('')}
        clearLabel={words.clearSearch}
      />
      <View role="group" accessibilityLabel={words.chargedLabel} style={styles.bases}>
        <Chip
          density="functional"
          active={bases.length === 0}
          onClick={() => setBases([])}
          groupName={words.chargedLabel}
        >
          {words.allBases}
        </Chip>
        {PRICE_BOOK_RATE_BASES.map((basis) => (
          <Chip
            key={basis}
            density="functional"
            active={bases.includes(basis)}
            onClick={() => setBases(basesToggled(bases, basis))}
            groupName={words.chargedLabel}
          >
            {words.bases[basis]}
          </Chip>
        ))}
      </View>
      {found.length === 0 ? (
        <Text variant="body-sm" color="secondary">
          {words.noMatch}
        </Text>
      ) : (
        <RateGroups rates={found} bases={words.bases} />
      )}
    </>
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
            <Card density="functional">
              <View style={styles.rows}>
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
            </Card>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: theme.spacing['sp-3'] },
  /* The charge chips wrap under the search, as the web's do. */
  bases: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-1'] },
  groups: { gap: theme.spacing['sp-4'] },
  group: { gap: theme.spacing['sp-2'] },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['sp-2'] },
  /* A group's rows inside the shared `Card`, as the web's list is: 8 between, 12 across. */
  rows: { gap: theme.spacing['sp-2'] },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['sp-3'] },
  name: { flex: 1, minWidth: 0 },
});
