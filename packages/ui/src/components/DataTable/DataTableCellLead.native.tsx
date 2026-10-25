import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { irisTintOf } from '../Avatar/Avatar.logic';
import { LEAD_TILE } from './DataTable.logic';
import type { DataTableColumn, DataTableLeading } from './DataTableColumn.types';

/** The kind's tile: the iris wash and ink are `irisTintOf`'s, the rule a kind Badge takes. */
function LeadTile({ leading }: { leading: DataTableLeading }) {
  const tint = irisTintOf(leading.iris);
  return (
    /* The kind is said in the words beside it; the tile is its second channel. */
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { backgroundColor: tint.bg }]}
    >
      <Svg
        width={ICON_SIZE.md}
        height={ICON_SIZE.md}
        viewBox="0 0 24 24"
        fill="none"
        stroke={tint.fg}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={leading.glyph} />
      </Svg>
    </View>
  );
}

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
  const leading = column.leading?.(row) ?? null;
  const sub = column.sub?.(row) ?? null;
  if (leading === null && sub === null) return children;

  return (
    <View style={styles.lead}>
      {leading === null ? null : <LeadTile leading={leading} />}
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
  tile: {
    width: LEAD_TILE,
    height: LEAD_TILE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-sm'],
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
