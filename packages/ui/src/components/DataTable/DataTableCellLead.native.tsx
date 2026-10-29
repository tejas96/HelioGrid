import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { IrisTile } from '../IrisTile/IrisTile.native';
import { cellLeadOf } from './DataTableCell.logic';
import type { DataTableColumn } from './DataTableColumn.types';

/** Quiet under a bold name. Bare words take the caption face; nodes bring their own. */
function SubLine({ sub }: { sub: ReactNode }) {
  return (
    <View style={styles.sub}>
      {typeof sub === 'string' || typeof sub === 'number' ? (
        <Text variant="caption" color="secondary">
          {String(sub)}
        </Text>
      ) : (
        sub
      )}
    </View>
  );
}

/**
 * **The record's kind tile before the value, and its quiet line under it** (`D268`). Both belong
 * to the cell, so they reach every form the cell is drawn in — the row's primary cell and the
 * card's title alike. A cell asking for neither is its value alone: no box is drawn around
 * content that is absent.
 */
export function CellLead<Row>({
  row,
  column,
  children,
}: {
  row: Row;
  column: DataTableColumn<Row>;
  children: ReactNode;
}) {
  const lead = cellLeadOf(row, column);
  if (lead === null) return children;
  const { leading, sub } = lead;

  return (
    <View style={styles.lead}>
      {leading === null ? null : (
        <IrisTile glyph={leading.glyph} iris={leading.iris} size={34} stroke={1.5} />
      )}
      <View style={styles.text}>
        {children}
        {sub === null ? null : <SubLine sub={sub} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Tile, then the value over its line: one row, the tile never above the name. */
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minWidth: 0,
  },
  text: {
    flexShrink: 1,
    minWidth: 0,
  },
  sub: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: theme.spacing['sp-6'],
  },
});
