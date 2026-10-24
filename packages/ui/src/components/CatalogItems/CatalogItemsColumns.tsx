import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Badge, Chip } from '../Chip';
import { ChipGroup } from '../ChipGroup';
import type { DataTableColumn } from '../DataTable/DataTableColumn.types';
import { NamedGap } from '../NamedGap';
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

const noPrice = (words: CatalogItemsWords) => (row: CatalogRow) =>
  row.amount === null ? words.noPrice : null;

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

/** The phone card's mark line: layer, the preferred and hidden marks, the spec label, compliance. */
function NarrowMarks({
  row,
  words,
  schemes,
}: { row: CatalogRow } & Omit<ColumnFacts, 'administers' | 'money'>) {
  return (
    <span className="hg-cat-what">
      <Text as="span" variant="caption" color="secondary">
        {row.specLine}
      </Text>
      <ChipGroup max={0} density="functional" label={words.marks} empty={null}>
        <Chip density="functional">{row.layerWord}</Chip>
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
        {row.provenance === 'representative' ? (
          <Badge tone="warning" density="functional">
            {row.provenanceWord}
          </Badge>
        ) : (
          <Chip density="functional">{row.provenanceWord}</Chip>
        )}
        {row.held.map((scheme) => (
          <Badge key={scheme} tone="success" density="functional">
            {scheme}
          </Badge>
        ))}
        {schemes.length > 0 && row.held.length === 0 ? (
          <NamedGap scale="cell" gap={words.noSchemeFlag} />
        ) : null}
      </ChipGroup>
    </span>
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

/** The phone card: the name, its mark line under it, the price on the title row. */
export function narrowColumns(facts: ColumnFacts): DataTableColumn<CatalogRow>[] {
  const { words, schemes, money } = facts;
  return [
    { key: 'name', label: words.item, primary: true },
    {
      key: 'what',
      label: words.whatItIs,
      secondary: true,
      render: (row) => <NarrowMarks row={row} words={words} schemes={schemes} />,
    },
    {
      key: 'price',
      label: words.effectivePrice,
      trailing: true,
      numeric: true,
      render: (row) => priceOf(row, money),
      gap: noPrice(words),
    },
  ];
}
