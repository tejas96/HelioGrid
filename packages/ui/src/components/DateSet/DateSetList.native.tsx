import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { ComplianceFloorSpec } from '../ComplianceFloor/ComplianceFloor.types';
import type { MarketFormat } from '../DatePicker/DatePicker.types';
import type { DateSetEntry } from './DateSet.types';
import { DateSetRow } from './DateSetRow.native';

const styles = StyleSheet.create({
  list: { minWidth: 0 },
  rows: { gap: theme.spacing['sp-2'] },
});

interface DateSetListProps {
  entries: DateSetEntry[];
  mkt: MarketFormat;
  packName: string;
  floor: ComplianceFloorSpec | undefined;
  listLabel: string;
  emptyMessage: string;
  blocked: string | null;
  density: 'expressive' | 'functional';
  onRemove?: (date: string, spokenName: string) => void;
}

/** The list half: an overline, then one row per date in the set. */
export function DateSetList({
  entries,
  mkt,
  packName,
  floor,
  listLabel,
  emptyMessage,
  blocked,
  density,
  onRemove,
}: DateSetListProps) {
  return (
    <View style={styles.list}>
      <Text variant="overline" color="tertiary">
        {listLabel}
      </Text>
      {entries.length === 0 ? (
        <Text variant="body-sm" color="secondary">
          {emptyMessage}
        </Text>
      ) : (
        /* The web half's rows are an `<ul>` of `<li>`, so the native half says the same. */
        <View role="list" style={styles.rows}>
          {entries.map((entry) => (
            <DateSetRow
              key={entry.date}
              entry={entry}
              mkt={mkt}
              packName={packName}
              floor={floor}
              blocked={blocked === entry.date}
              density={density}
              onRemove={onRemove}
            />
          ))}
        </View>
      )}
    </View>
  );
}
