import { PRICE_BOOK_RATE_BASES, type PriceBookRateBasis } from '@heliogrid/domain';
import { useState } from 'react';
import { Text } from '../../primitives/Text/Text';
import { useOwnWidth } from '../../primitives/use-own-width';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { RetryButton } from '../Button/RetryButton';
import { Card } from '../Card';
import { CATALOG_WIDE_FROM } from '../CatalogItems/CatalogItems.rows';
import { CatalogStripBar } from '../CatalogItems/CatalogStrip';
import { Badge, Chip } from '../Chip';
import { DataTable } from '../DataTable';
import { EmptyState } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { useFormat } from '../MarketProvider';
import { SearchField } from '../SearchField';
import { matchingRates, RATE_BASIS_TONE, ratesByBasis } from './CatalogRates.logic';
import type { CatalogRate, CatalogRatesProps, CatalogRatesWords } from './CatalogRates.types';
import './CatalogRates.css';

/**
 * Catalog settings' *Rates* panel on the web: the price book's strip, then its rates — grouped by
 * how each is charged in a narrow room, one searchable table in a wide one. Before the first
 * version it teaches that the first set becomes version 1.
 */
export function CatalogRates(props: CatalogRatesProps) {
  const { words, read } = props;
  const [room, width] = useOwnWidth();
  const wide = width !== null && width >= CATALOG_WIDE_FROM;
  /* *Try again* leaves with the failure: focus goes to the panel, which stays while it reloads. */
  return (
    <div
      ref={room}
      tabIndex={-1}
      className="hg-cat-rates hg-focus-target"
      data-wide={wide ? 'true' : undefined}
    >
      {read.kind === 'failed' ? (
        <EmptyState
          glow={false}
          icon={<ShellGlyph name="alert-circle" size="xl" />}
          title={words.loadFailed}
          action={
            <RetryButton size="lg" onRetry={read.retry} label={words.tryAgain} focusAfter={room} />
          }
        />
      ) : read.kind === 'loading' ? (
        <LoadingBars label={words.loading} bars={['row', 'row', 'row', 'row']} />
      ) : (
        <RatesReady props={props} wide={wide} />
      )}
    </div>
  );
}

/** The strip and the rates in force, or the first-day teaching. */
function RatesReady({ props, wide }: { props: CatalogRatesProps; wide: boolean }) {
  const { words } = props;
  return (
    <>
      <CatalogStripBar strip={props.strip} />
      {props.rates.length === 0 ? (
        <EmptyState
          glow={false}
          icon={<ShellGlyph name="document" size="lg" />}
          title={words.noRates}
          description={words.noRatesBody}
          action={
            props.onAddFirst === null ? undefined : (
              <Button variant="secondary" size="sm" onClick={props.onAddFirst}>
                {words.addFirstRate}
              </Button>
            )
          }
        />
      ) : wide ? (
        <RatesTable read={props.read} rates={props.rates} words={words} />
      ) : (
        <RateGroups rates={props.rates} bases={words.bases} />
      )}
    </>
  );
}

/** One group per way of charging: its word and count over a tile of name · amount rows. */
export function RateGroups({
  rates,
  bases,
}: {
  rates: readonly CatalogRate[];
  bases: Readonly<Record<PriceBookRateBasis, string>>;
}) {
  const format = useFormat();
  return (
    <div className="hg-cat-rate-groups">
      {ratesByBasis(rates).map((group) => (
        <section key={group.basis} className="hg-cat-rate-group" aria-label={bases[group.basis]}>
          <span className="hg-cat-rate-group-head">
            <Text as="span" variant="overline" color="secondary">
              {bases[group.basis]}
            </Text>
            <Text as="span" variant="caption" color="secondary">
              {String(group.rates.length)}
            </Text>
          </span>
          <Card density="functional">
            <ul className="hg-cat-rate-rows">
              {group.rates.map((rate) => (
                <li key={rate.key} className="hg-cat-rate-row">
                  <Text as="span" variant="body-sm">
                    {rate.name}
                  </Text>
                  <Text as="span" variant="mono" bold>
                    {format.money(rate.amount)}
                  </Text>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}

/** The 1536 table: *Search rates* and the charge chips over Rate · Charged · Amount, filtered here. */
function RatesTable({
  read,
  rates,
  words,
}: {
  read: CatalogRatesProps['read'];
  rates: readonly CatalogRate[];
  words: CatalogRatesWords;
}) {
  const format = useFormat();
  const [query, setQuery] = useState('');
  const [bases, setBases] = useState<PriceBookRateBasis[]>([]);
  const toggle = (basis: PriceBookRateBasis) =>
    setBases(bases.includes(basis) ? bases.filter((each) => each !== basis) : [...bases, basis]);
  return (
    <>
      <div className="hg-cat-rates-controls">
        <span className="hg-cat-rates-search">
          <SearchField
            density="functional"
            placeholder={words.searchRates}
            ariaLabel={words.searchRates}
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            clearLabel={words.clearSearch}
          />
        </span>
        <fieldset className="hg-cat-rates-bases" aria-label={words.chargedLabel}>
          <Chip density="functional" active={bases.length === 0} onClick={() => setBases([])}>
            {words.allBases}
          </Chip>
          {PRICE_BOOK_RATE_BASES.map((basis) => (
            <Chip
              key={basis}
              density="functional"
              active={bases.includes(basis)}
              onClick={() => toggle(basis)}
            >
              {words.bases[basis]}
            </Chip>
          ))}
        </fieldset>
      </div>
      <DataTable<CatalogRate>
        {...words.table}
        read={read}
        rows={matchingRates(rates, query, bases)}
        rowKey="key"
        head="quiet"
        density="compact"
        stackBelow={0}
        caption={words.ratesInForce}
        emptyTitle={words.noMatch}
        columns={[
          { key: 'name', label: words.rate, primary: true },
          {
            key: 'basis',
            label: words.charged,
            render: (rate) => (
              <Badge tone={RATE_BASIS_TONE[rate.basis]} density="functional">
                {words.bases[rate.basis]}
              </Badge>
            ),
          },
          {
            key: 'amount',
            label: words.amount,
            numeric: true,
            render: (rate) => (
              <Text as="span" variant="mono" bold>
                {format.money(rate.amount)}
              </Text>
            ),
          },
        ]}
      />
    </>
  );
}
