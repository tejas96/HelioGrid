import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button.native';
import { DataTable } from '../DataTable/DataTable.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { ATTRIBUTION_STACK_BELOW, attributionColumns } from './CatalogRates.attribution';
import type { CatalogAttributionProps, CatalogAttributionRow } from './CatalogRates.types';

/**
 * *Why a price is what it is* on the phone (`SCR-M01-15` m15-d): every item the company changed,
 * as cards, each field beside the layer that supplied it.
 */
export function CatalogAttribution(props: CatalogAttributionProps) {
  const { words, rows, onMore } = props;
  if (props.surface === 'loading') return null;
  if (props.surface === 'error') {
    return (
      <EmptyState
        glow={false}
        title={words.loadFailed}
        action={
          <Button variant="secondary" size="sm" onClick={props.onRetry}>
            {words.tryAgain}
          </Button>
        }
      />
    );
  }
  return (
    <View style={styles.table}>
      <DataTable<CatalogAttributionRow>
        columns={attributionColumns(words)}
        rows={[...rows]}
        rowKey="id"
        stackBelow={ATTRIBUTION_STACK_BELOW}
        density="compact"
        caption={words.caption}
      />
      {onMore === null ? null : (
        <Button variant="ghost" size="sm" onClick={onMore}>
          {words.more}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { gap: theme.spacing['sp-2'] },
});
