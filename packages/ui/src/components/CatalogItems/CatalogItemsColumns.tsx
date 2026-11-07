import { StatusMark } from '../../primitives/StatusMark/StatusMark';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Badge } from '../Chip';
import type { DataTableColumn } from '../DataTable/DataTableColumn.types';
import { CATALOG_KIND_LEADING } from './CatalogItems.rows';
import type { CatalogItemsWords, CatalogRow } from './CatalogItems.types';

interface ColumnFacts {
  words: CatalogItemsWords;
  schemes: readonly string[];
  administers: boolean;
  /** The market's money format, from `useFormat()`. */
  money: (amount: string) => string;
}

/** The figure, or the named absence: a platform item with no tenant price reads *No price set*. */
function priceOf(row: CatalogRow, money: ColumnFacts['money']) {
  return typeof row.amount === 'string' ? (
    <Text as="span" variant="mono" bold className="hg-cat-figure">
      {money(row.amount)}
    </Text>
  ) : null;
}

/* A missing price is a warning a proposal will meet, so it reads as one: glyph, word and tint. */
const noPrice = (words: CatalogItemsWords) => (row: CatalogRow) =>
  row.amount === null ? <StatusMark tone="warning" label={words.noPrice} /> : null;

/**
 * The 1536 line under the name: *kind · spec*, the spec label as a small mark, and *Hidden from
 * pickers* in words when hidden; *Preferred* in words only where the star act is absent.
 */
function WideSub({
  row,
  words,
  administers,
}: { row: CatalogRow } & Omit<ColumnFacts, 'schemes' | 'money'>) {
  return (
    <>
      <span>{row.specLine}</span>
      {row.provenance === 'verified_datasheet' ? (
        <span className="hg-cat-verified">
          <ShellGlyph name="tick-small" size="sm" tone="success" />
          <Text as="span" variant="caption" color="success">
            {row.provenanceWord}
          </Text>
        </span>
      ) : row.provenance === 'representative' ? (
        <Badge tone="warning" density="functional">
          {row.provenanceWord}
        </Badge>
      ) : (
        <span>{row.provenanceWord}</span>
      )}
      {row.hidden ? (
        <Badge tone="warning" density="functional">
          <span className="hg-cat-badge-glyph">
            <ShellGlyph name="eye-off" size="sm" />
            {words.hiddenFromPickers}
          </span>
        </Badge>
      ) : null}
      {!administers && row.preferred ? (
        <Badge tone="accent" density="functional">
          {words.preferred}
        </Badge>
      ) : null}
    </>
  );
}

/** The 1536 table: Item (kind tile, name, its line) · Compliance · Effective price · Price comes from. */
export function wideColumns(facts: ColumnFacts): DataTableColumn<CatalogRow>[] {
  const { words, schemes, money } = facts;
  const compliance: DataTableColumn<CatalogRow>[] =
    schemes.length === 0
      ? []
      : [
          {
            key: 'compliance',
            label: words.compliance,
            render: (row) =>
              row.held.length === 0 ? (
                <Text as="span" variant="caption" color="secondary">
                  {words.noSchemeFlag}
                </Text>
              ) : (
                <span className="hg-cat-badges">
                  {row.held.map((scheme) => (
                    <Badge key={scheme} tone="success" density="functional">
                      {scheme}
                    </Badge>
                  ))}
                </span>
              ),
          },
        ];
  return [
    {
      key: 'name',
      label: words.item,
      primary: true,
      strong: true,
      leading: (row) => CATALOG_KIND_LEADING[row.kind],
      sub: (row) => <WideSub row={row} words={words} administers={facts.administers} />,
      render: (row) => (
        <span className="hg-cat-name" title={row.name}>
          {row.name}
        </span>
      ),
    },
    ...compliance,
    {
      key: 'price',
      label: words.effectivePrice,
      numeric: true,
      render: (row) => priceOf(row, money),
      gap: noPrice(words),
    },
    {
      key: 'priceFrom',
      label: words.priceComesFrom,
      render: (row) => (
        <Text as="span" variant="caption" color="secondary">
          {row.priceFrom}
        </Text>
      ),
    },
  ];
}
