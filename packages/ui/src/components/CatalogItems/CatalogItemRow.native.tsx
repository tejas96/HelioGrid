import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { CardRow, useCardRowAsideRoom } from '../CardRows/CardRows.native';
import { Badge } from '../Chip/Chip.native';
import { HueTile } from '../HueTile/HueTile.native';
import { Provenance } from '../Provenance/Provenance.native';
import { CATALOG_KIND_LEADING } from './CatalogItems.rows';
import type { CatalogItemsProps, CatalogRow } from './CatalogItems.types';
import { CatalogRowActs } from './CatalogRowActs.native';

export interface CatalogItemRowProps {
  row: CatalogRow;
  props: CatalogItemsProps;
  /** The row's write in flight or back, as its pending line; `null` with none. */
  pending: ReactNode;
  waiting: boolean;
  money: (amount: string) => string;
  /** The first row draws no hairline above it. */
  first: boolean;
}

/**
 * One item in the list's glass card on the phone (direction A): kind tile, the name on one line over
 * its spec line, the marks under them with the price — or *No price set* — closing their line. No
 * toggles: *Prefer* and *Hide* are in the item's sheet. The row opens the item; an archived row's
 * *Restore* sits beside the press target (`CardRow`), never inside it, so a screen reader reaches it
 * on its own.
 */
export function CatalogItemRow({
  row,
  props,
  pending,
  waiting,
  money,
  first,
}: CatalogItemRowProps) {
  const { words, administers } = props;
  const lead = CATALOG_KIND_LEADING[row.kind];
  const opens = administers && !row.archived;
  /* A narrow row carries no toggles (direction A): *Prefer* and *Hide* are in the item's sheet, one
     tap away. An archived own SKU cannot open, so it keeps *Restore*. */
  const restores = administers && row.archived && row.source === 'own_item';
  return (
    <CardRow
      first={first}
      open={opens ? { name: row.labels.row, onOpen: () => props.onOpen(row) } : undefined}
      aside={restores ? <CatalogRowActs row={row} stacked acts={props} /> : undefined}
      after={pending}
      highlighted={row.id === props.addedId || row.id === props.openedId}
      muted={row.archived}
      busy={waiting}
    >
      <RowTop>
        <HueTile glyph={lead.glyph} hue={lead.hue} size={40} stroke={1.5} />
        <View style={styles.words}>
          <Text variant="body" bold oneLine>
            {row.name}
          </Text>
          <Text variant="caption" color="secondary">
            {row.specLine}
          </Text>
        </View>
      </RowTop>
      <View style={styles.marks}>
        <RowMarks row={row} props={props} />
        <View style={styles.price}>
          {typeof row.amount === 'string' ? (
            <Text variant="mono" bold>
              {money(row.amount)}
            </Text>
          ) : row.amount === null ? (
            <StatusMark tone="warning" label={words.noPrice} />
          ) : null}
        </View>
      </View>
    </CardRow>
  );
}

/** The tile and the words, kept clear of an archived row's *Restore* at its end. */
function RowTop({ children }: { children: ReactNode }) {
  return <View style={[styles.top, { paddingEnd: useCardRowAsideRoom() }]}>{children}</View>;
}

/** The marks under the spec: whose it is, the picker states, where its data comes from, its schemes held. */
function RowMarks({ row, props }: { row: CatalogRow; props: CatalogItemsProps }) {
  const { words } = props;
  return (
    <>
      {/* The platform's own layer is the list's default, which its summary already says; only a
          layer the company made is marked. */}
      {row.layer === 'platform' ? null : (
        <Text variant="caption" color="accent">
          {row.layerWord}
        </Text>
      )}
      {row.preferred ? (
        <Badge tone="accent" density="functional">
          {words.preferred}
        </Badge>
      ) : null}
      {row.hidden ? (
        <Badge tone="warning" density="functional">
          {words.hiddenFromPickers}
        </Badge>
      ) : null}
      {/* Where the spec's figures come from is the quiet provenance word (`Provenance`, as every
          figure's tier is): on every row of a fresh catalog, an amber badge made a wall of warnings. */}
      {row.provenance === 'representative' ? (
        <Provenance source={row.provenanceWord} size={12} />
      ) : (
        <Text
          variant="caption"
          color={row.provenance === 'verified_datasheet' ? 'success' : 'secondary'}
        >
          {row.provenanceWord}
        </Text>
      )}
      {row.held.map((scheme) => (
        <Badge key={scheme} tone="success" density="functional">
          {scheme}
        </Badge>
      ))}
      {/* A scheme the item holds is marked; none held draws nothing in a row — the absence is the
          missing chip, and the item's sheet and the wide table name it. */}
    </>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  /* Under the tile and the words, the row's whole width, so a phone's row holds them on one line. */
  marks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-2'],
    rowGap: theme.spacing['sp-1'],
  },
  /* The price — or its absence — closes the marks' line at the row's end. */
  price: { marginStart: 'auto' },
});
