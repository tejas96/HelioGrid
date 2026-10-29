import type { CatalogImportRowWire } from '@heliogrid/contracts';
import { Fragment } from 'react';
import { Pressable } from '../../primitives/Pressable';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Button } from '../Button';
import { IrisTile } from '../IrisTile/IrisTile';
import { StatusChip } from '../StatusChip';
import { type ImportFormats, type ImportListRowView, listRowOf } from './CatalogImport.logic';
import type { CatalogImportWords, ImportGroupId, ImportRowList } from './CatalogImport.types';
import { groupSampleOf, type ImportSampleItem, rowsOf } from './CatalogImport.view';
import { ImportGlyph } from './ImportGlyph';
import './ImportOutcomeGroup.css';

type Phase = 'preview' | 'report';

/** A folded group's tile: its glyph and its iris hue — written prices blue, new products violet. */
interface GroupTile {
  readonly glyph: ShellGlyphName;
  readonly hue: 'blue' | 'violet';
}

const GROUP_TILE: Partial<Record<ImportGroupId, GroupTile>> = {
  overrides: { glyph: 'pencil', hue: 'blue' },
  applied: { glyph: 'pencil', hue: 'blue' },
  newItems: { glyph: 'plus', hue: 'violet' },
  created: { glyph: 'plus', hue: 'violet' },
};

const OTHER_TILE: GroupTile = { glyph: 'lines', hue: 'blue' };

interface ImportOutcomeGroupProps {
  group: ImportRowList & { readonly id: ImportGroupId };
  open: boolean;
  onToggle: () => void;
  words: CatalogImportWords;
  formats: ImportFormats;
  phase: Phase;
  wide: boolean;
}

/**
 * One outcome folded to a raised line — its count and a sample of its first rows — that opens to
 * the full list, 50 rows at a time. The chevron turns and the list fades in as `Accordion`'s do.
 */
export function ImportOutcomeGroup(props: ImportOutcomeGroupProps) {
  const { group, open, words, wide } = props;
  const tile = GROUP_TILE[group.id] ?? OTHER_TILE;
  const sample = groupSampleOf(rowsOf(group), words, props.formats, props.phase);
  return (
    <div className="hg-import-group">
      <Pressable
        className="hg-import-group-line"
        accessibilityState={{ expanded: open }}
        onPress={props.onToggle}
      >
        <IrisTile glyph={tile.glyph} iris={tile.hue} size={36} stroke={1.7} />
        <span className="hg-import-group-words">
          <span className="hg-import-group-title">
            {words.groupTitle(words.groups[group.id], group.total)}
          </span>
          {open && wide ? null : (
            <Sample items={sample} more={group.total > sample.length} words={words} />
          )}
        </span>
        <ImportGlyph
          name="chevron"
          size={wide ? 'md' : 'sm'}
          stroke={1.7}
          className="hg-import-group-chevron"
        />
      </Pressable>
      {open ? (
        <div className="hg-import-group-panel">
          <ImportOutcomeList {...props} rows={rowsOf(group)} />
          <MoreRows list={group} words={words} />
        </div>
      ) : null}
    </div>
  );
}

/** The sample: each row's name with its price change in mono, kept to one line. */
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
    <span className="hg-import-group-sample">
      {items.map((item, index) => (
        <Fragment key={item.rowNumber}>
          {index === 0 ? null : ' · '}
          {item.name}{' '}
          <span className="hg-import-money">
            {item.was === null ? null : `${item.was} → `}
            {item.now ?? words.noPrice}
          </span>
        </Fragment>
      ))}
      {more ? ' …' : null}
    </span>
  );
}

/** *Show more*: the next page of an opened list. */
export function MoreRows({ list, words }: { list: ImportRowList; words: CatalogImportWords }) {
  const { read } = list;
  if (read.kind === 'failed') {
    return (
      <div className="hg-import-more">
        <Button variant="secondary" size="sm" onClick={read.retry}>
          {words.tryAgain}
        </Button>
      </div>
    );
  }
  if (!list.hasMore) return null;
  return (
    <div className="hg-import-more">
      <Button variant="ghost" size="sm" onClick={list.onMore}>
        {words.showMore}
      </Button>
    </div>
  );
}

/**
 * The rows of one outcome: the name, what it matched, the report's reason where the row was not
 * written, the outcome as a word plus a dot, and the price change. At 375 each row stacks; at 1536
 * it is one line with the price change in a box of its own.
 */
export function ImportOutcomeList({
  rows,
  words,
  formats,
  phase,
  wide,
}: {
  rows: readonly CatalogImportRowWire[];
  words: CatalogImportWords;
  formats: ImportFormats;
  phase: Phase;
  wide: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <ul className="hg-import-list" data-wide={wide ? 'true' : 'false'}>
      {rows.map((row) => (
        <OutcomeRow
          key={row.rowNumber}
          view={listRowOf(row, words, formats, phase)}
          words={words}
          wide={wide}
        />
      ))}
    </ul>
  );
}

function OutcomeRow({
  view,
  words,
  wide,
}: {
  view: ImportListRowView;
  words: CatalogImportWords;
  wide: boolean;
}) {
  const named = (
    <>
      <span className="hg-import-line" data-weight="bold">
        {view.title}
      </span>
      <span className="hg-import-line" data-tone="secondary">
        {view.sub}
      </span>
      {view.reason === null ? null : (
        <span className="hg-import-reason" data-tone={view.reasonTone ?? undefined}>
          {view.reason}
        </span>
      )}
    </>
  );
  const chip = <StatusChip label={view.chip.label} tone={view.chip.tone} density="functional" />;
  return (
    <li className="hg-import-row">
      {wide ? <span className="hg-import-row-named">{named}</span> : named}
      <span className="hg-import-row-foot">
        {chip}
        <PricePair view={view} words={words} />
      </span>
    </li>
  );
}

/** The price before and after, in mono: *No price* where none was, *Unchanged* where none came. */
function PricePair({ view, words }: { view: ImportListRowView; words: CatalogImportWords }) {
  return (
    <span className="hg-import-pair">
      {view.was === null ? (
        <span className="hg-import-pair-word">{words.noPrice}</span>
      ) : (
        <span className="hg-import-money" data-was="true">
          {view.was}
        </span>
      )}
      <span className="hg-import-pair-word" role="img" aria-label={words.becomes}>
        →
      </span>
      {view.now === null ? (
        <span className="hg-import-pair-word">{words.unchanged}</span>
      ) : (
        <span className="hg-import-money" data-now="true">
          {view.now}
        </span>
      )}
    </span>
  );
}
