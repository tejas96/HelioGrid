import type { CatalogImportRowWire } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Button } from '../Button/Button.native';
import { IrisTile } from '../IrisTile/IrisTile.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { type ImportFormats, type ImportListRowView, listRowOf } from './CatalogImport.logic';
import { CARD_RADIUS, raisedCard, rowDivider } from './CatalogImport.surfaces.native';
import type { CatalogImportWords, ImportGroupId, ImportRowList } from './CatalogImport.types';
import { groupSampleOf, type ImportSampleItem, rowsOf } from './CatalogImport.view';
import { ImportGlyph } from './ImportGlyph.native';

type Phase = 'preview' | 'report';

/** A folded group's tile: its glyph and its iris hue — written prices blue, new products violet. */
const GROUP_TILE: Partial<
  Record<ImportGroupId, { glyph: ShellGlyphName; hue: 'blue' | 'violet' }>
> = {
  overrides: { glyph: 'pencil', hue: 'blue' },
  applied: { glyph: 'pencil', hue: 'blue' },
  newItems: { glyph: 'plus', hue: 'violet' },
  created: { glyph: 'plus', hue: 'violet' },
};

interface ImportOutcomeGroupProps {
  group: ImportRowList & { readonly id: ImportGroupId };
  open: boolean;
  onToggle: () => void;
  words: CatalogImportWords;
  formats: ImportFormats;
  phase: Phase;
}

/**
 * One outcome folded to a raised line — its count and a sample of its first rows — that opens to
 * the full list, 50 rows at a time. As `Accordion.native` does, the chevron turns and the list is
 * there at once: nothing animates, so reduced motion has nothing to stop.
 */
export function ImportOutcomeGroup(props: ImportOutcomeGroupProps) {
  const { group, open, words } = props;
  const tile = GROUP_TILE[group.id] ?? { glyph: 'lines', hue: 'blue' };
  const sample = groupSampleOf(rowsOf(group), words, props.formats, props.phase);
  return (
    <View style={styles.group}>
      <Pressable
        accessibilityState={{ expanded: open }}
        onPress={props.onToggle}
        style={styles.line}
      >
        <IrisTile glyph={tile.glyph} iris={tile.hue} size={36} stroke={1.7} />
        <View style={styles.words}>
          <Text variant="body-sm" bold>
            {words.groupTitle(words.groups[group.id], group.total)}
          </Text>
          <Sample items={sample} more={group.total > sample.length} words={words} />
        </View>
        <ImportGlyph
          name={open ? 'chevron-up' : 'chevron'}
          size="sm"
          stroke={1.7}
          color={theme.colors['text-secondary']}
        />
      </Pressable>
      {open ? (
        <>
          <ImportOutcomeList
            rows={rowsOf(group)}
            words={words}
            formats={props.formats}
            phase={props.phase}
          />
          <MoreRows list={group} words={words} />
        </>
      ) : null}
    </View>
  );
}

/** The sample: each row's name with its price change in mono, kept to one line — the file's data. */
function Sample({
  items,
  more,
  words,
}: {
  items: readonly ImportSampleItem[];
  more: boolean;
  words: CatalogImportWords;
}) {
  if (items.length === 0) return null;
  return (
    <Text variant="caption" color="secondary" oneLine>
      {items.map((item, index) => (
        <Fragment key={item.rowNumber}>
          {index === 0 ? null : ' · '}
          {item.name}{' '}
          <Text variant="mono" color="secondary" style={styles.sampleMoney}>
            {item.was === null ? null : `${item.was} → `}
            {item.now ?? words.noPrice}
          </Text>
        </Fragment>
      ))}
      {more ? ' …' : null}
    </Text>
  );
}

/** *Show more*: the next page of an opened list. */
export function MoreRows({ list, words }: { list: ImportRowList; words: CatalogImportWords }) {
  const { read } = list;
  if (read.kind === 'failed') {
    return (
      <View style={styles.more}>
        <Button variant="secondary" size="sm" onClick={read.retry}>
          {words.tryAgain}
        </Button>
      </View>
    );
  }
  if (!list.hasMore) return null;
  return (
    <View style={styles.more}>
      <Button variant="ghost" size="sm" onClick={list.onMore}>
        {words.showMore}
      </Button>
    </View>
  );
}

/**
 * The rows of one outcome, stacked: the name, what it matched, the report's reason where the row
 * was not written, the outcome as a word plus a dot, and the price change.
 */
export function ImportOutcomeList({
  rows,
  words,
  formats,
  phase,
}: {
  rows: readonly CatalogImportRowWire[];
  words: CatalogImportWords;
  formats: ImportFormats;
  phase: Phase;
}) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.list}>
      {rows.map((row, index) => (
        <OutcomeRow
          key={row.rowNumber}
          view={listRowOf(row, words, formats, phase)}
          words={words}
          parted={index > 0}
        />
      ))}
    </View>
  );
}

function OutcomeRow({
  view,
  words,
  parted,
}: {
  view: ImportListRowView;
  words: CatalogImportWords;
  parted: boolean;
}) {
  return (
    <View style={parted ? [styles.row, rowDivider] : styles.row}>
      <Text variant="body-sm" bold oneLine>
        {view.title}
      </Text>
      <Text variant="caption" color="secondary">
        {view.sub}
      </Text>
      {view.reason === null ? null : (
        <Text variant="caption" color="secondary">
          {view.reason}
        </Text>
      )}
      <View style={styles.foot}>
        <StatusChip label={view.chip.label} tone={view.chip.tone} density="functional" />
        <PricePair view={view} words={words} />
      </View>
    </View>
  );
}

/** The price before and after, in mono: *No price* where none was, *Unchanged* where none came. */
function PricePair({ view, words }: { view: ImportListRowView; words: CatalogImportWords }) {
  return (
    <View style={styles.pair}>
      {view.was === null ? (
        <Text variant="caption" color="secondary">
          {words.noPrice}
        </Text>
      ) : (
        <Text variant="mono" color="secondary">
          {view.was}
        </Text>
      )}
      <View accessible accessibilityLabel={words.becomes}>
        <Text variant="caption" color="secondary">
          {'→'}
        </Text>
      </View>
      {view.now === null ? (
        <Text variant="caption" color="secondary">
          {words.unchanged}
        </Text>
      ) : (
        <Text variant="mono" bold>
          {view.now}
        </Text>
      )}
    </View>
  );
}

/* The board's 375 group: the line radius 18 at 12 by 14, 12 between its parts, a 36 tile; the
   list's rows 12 by 14, 4 between their lines, the chip and the pair 2 under them. */
const styles = StyleSheet.create({
  group: { gap: theme.spacing['sp-3'] },
  line: {
    ...raisedCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: 14,
    borderRadius: CARD_RADIUS,
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  sampleMoney: { fontSize: theme.type.roles.caption.fontSize },
  more: { alignItems: 'center' },
  list: { ...raisedCard, borderRadius: CARD_RADIUS },
  row: {
    gap: theme.spacing['sp-1'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: 14,
  },
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-0-5'],
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 0,
    marginLeft: 'auto',
  },
});
