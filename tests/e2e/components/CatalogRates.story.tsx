import type { PriceBookRateBasis, UiLanguage } from '@heliogrid/domain';
import {
  catalogAttributionWords,
  catalogRatesWords,
  catalogVersionWords,
  createTranslator,
  PRICE_BOOK,
  priceBookStripWords,
  rateSheetWords,
  versionRowWords,
} from '@heliogrid/i18n';
import {
  CatalogAttribution,
  type CatalogAttributionRow,
  type CatalogRate,
  CatalogRateEdit,
  CatalogRates,
  CatalogVersion,
  useFormat,
} from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** The board's version 7 (`m15-d`): seven per job, two per kW, one per visit, one per metre. */
const V7: readonly CatalogRate[] = [
  ['install-10', 'Standard installation, up to 10 kW', 'per_job', '18000'],
  ['engineering', 'Engineering and drawings', 'per_job', '6500'],
  ['discom', 'DISCOM liaison and net metering', 'per_job', '9000'],
  ['earthing', 'Earthing kit and installation', 'per_job', '4800'],
  ['scaffold', 'Scaffolding and roof access', 'per_job', '3500'],
  ['commission', 'Commissioning and handover', 'per_job', '2500'],
  ['amc', 'Annual maintenance, year one', 'per_job', '4000'],
  ['install-big', 'Standard installation, above 10 kW', 'per_kw', '1450'],
  ['elevated', 'Elevated structure surcharge', 'per_kw', '2100'],
  ['survey', 'Site survey visit', 'per_visit', '1200'],
  ['cable', 'Cable run beyond 30 m', 'per_metre', '95'],
].map(([key, name, basis, amount]) => ({
  key: key ?? '',
  name: name ?? '',
  basis: basis as PriceBookRateBasis,
  amount: amount ?? '',
}));

export type RatesFrame = 'rates' | 'empty' | 'loading' | 'error';

/** The Rates panel as the page holds it; *Add your first rate* reports as `data-added`. */
export function CatalogRatesAsRead({ reader, frame }: { reader: UiLanguage; frame: RatesFrame }) {
  const { t } = READERS[reader];
  const [added, setAdded] = useState(false);
  const empty = frame === 'empty';
  return (
    <div lang={reader} data-added={added} style={{ padding: 16, maxWidth: 1104 }}>
      <CatalogRates
        words={catalogRatesWords(t)}
        surface={frame === 'loading' ? 'loading' : frame === 'error' ? 'error' : 'ready'}
        onRetry={() => undefined}
        strip={{
          ...priceBookStripWords(
            t,
            empty ? null : { number: 7, margin: '18.0%', since: '12 Aug' },
            true,
          ),
          onLink: () => undefined,
          onAction: () => undefined,
        }}
        rates={empty ? [] : V7}
        onAddFirst={() => setAdded(true)}
      />
    </div>
  );
}

/**
 * One price-book version: the list by year, version 5 read-only, or version 8 being written as the
 * board lists it; a name or *Add a rate* reports what it would open as `data-opened`.
 */
export function CatalogVersionAsRead({
  reader,
  mode,
}: {
  reader: UiLanguage;
  mode: 'list' | 'read' | 'edit';
}) {
  const { t } = READERS[reader];
  const format = useFormat();
  const [opened, setOpened] = useState('');
  const words = catalogVersionWords(t);
  if (mode === 'list') {
    return (
      <div lang={reader} data-opened={opened} style={{ padding: 16, maxWidth: 480 }}>
        <CatalogVersion
          mode="list"
          words={words}
          surface="ready"
          onRetry={() => undefined}
          onOpen={setOpened}
          hasMore={false}
          onMore={() => undefined}
          versions={[
            {
              id: 'v7',
              number: 7,
              tag: t(PRICE_BOOK.versionTag, { number: 7 }),
              note: 'Installation above 10 kW moved to a per-kW rate.',
              byline: '12 Aug 2026 · Rajesh Kulkarni',
              year: '2026',
              margin: '18.0%',
              inForce: true,
            },
            {
              id: 'v5',
              number: 5,
              tag: t(PRICE_BOOK.versionTag, { number: 5 }),
              note: 'Default margin raised from 15%.',
              byline: '14 Apr 2026 · Anjali Kulkarni',
              year: '2026',
              margin: '16.5%',
              inForce: false,
            },
            {
              id: 'v1',
              number: 1,
              tag: t(PRICE_BOOK.versionTag, { number: 1 }),
              note: 'First price book.',
              byline: '6 Sep 2025 · Rajesh Kulkarni',
              year: '2025',
              margin: '15.0%',
              inForce: false,
            },
          ]}
        />
      </div>
    );
  }
  if (mode === 'read') {
    return (
      <div lang={reader} style={{ padding: 16, maxWidth: 480 }}>
        <CatalogVersion
          mode="read"
          words={words}
          margin="16.5%"
          rateCount="11"
          note="Default margin raised from 15%."
          rates={V7}
          surface="ready"
          onRetry={() => undefined}
        />
      </div>
    );
  }
  /* Version 8 starts from version 7: the engineering fee raised from ₹6,500 to ₹7,000. */
  const rows = V7.map((rate) => {
    const amount = rate.key === 'engineering' ? '7000' : rate.amount;
    return {
      key: rate.key,
      ...versionRowWords(t, { name: { en: rate.name }, amount, was: rate.amount }, reader, (a) =>
        format.money(a),
      ),
      onOpen: () => setOpened(rate.key),
      basis: rate.basis,
      amount,
      onAmount: () => undefined,
    };
  });
  return (
    <div lang={reader} data-opened={opened} style={{ padding: 16, maxWidth: 640 }}>
      <CatalogVersion
        mode="edit"
        words={words}
        margin="18"
        onMargin={() => undefined}
        note="Engineering and drawings raised to ₹7,000."
        onNote={() => undefined}
        rows={rows}
        onAddRate={() => setOpened('new')}
        noteHint={null}
        problem={null}
      />
    </div>
  );
}

/** The rate sheet on *Engineering and drawings*: English written, Hindi and Marathi not yet. */
export function CatalogRateEditAsRead({ reader }: { reader: UiLanguage }) {
  const { t } = READERS[reader];
  const [name, setName] = useState<Partial<Record<UiLanguage, string>>>({
    en: 'Engineering and drawings',
  });
  const words = rateSheetWords(t, { name }, false);
  return (
    <div lang={reader} style={{ padding: 16, maxWidth: 480 }}>
      <CatalogRateEdit
        names={words.names}
        onName={(language, value) => setName((now) => ({ ...now, [language]: value }))}
        basis="per_job"
        basisLabel={words.basis}
        bases={catalogVersionWords(t).bases}
        onBasis={() => undefined}
        remove={words.remove === null ? null : { label: words.remove, onRemove: () => undefined }}
      />
    </div>
  );
}

/** The board's attribution cards (m15-d): an overridden price, a set tax, a hide, an own SKU. */
const CHANGED = (): CatalogAttributionRow[] => {
  return [
    {
      id: 'adani',
      name: 'Adani Solar AS-7-545',
      what: 'Panel · Overridden',
      price: '₹12,500',
      priceFrom: 'Your override',
      tax: null,
      taxOverridden: false,
      pickers: 'Shown',
      pickersOwn: false,
      preferred: 'Yes',
      preferredOwn: true,
    },
    {
      id: 'premier',
      name: 'Premier Energies PE-M550 with a long model name that wraps',
      what: 'Panel · Overridden',
      price: null,
      priceFrom: 'Platform catalog carries no price',
      tax: '5%',
      taxOverridden: true,
      pickers: 'Hidden',
      pickersOwn: true,
      preferred: 'No',
      preferredOwn: false,
    },
  ];
};

/** *Why a price is what it is*; *Show more items* reports as `data-more`. */
export function CatalogAttributionAsRead({ reader }: { reader: UiLanguage }) {
  const { t } = READERS[reader];
  const [more, setMore] = useState(false);
  return (
    <div lang={reader} data-more={more} style={{ padding: 16, maxWidth: 375 }}>
      <CatalogAttribution
        words={catalogAttributionWords(t, { changed: 6, total: 342 }, String)}
        surface="ready"
        onRetry={() => undefined}
        rows={CHANGED()}
        onMore={() => setMore(true)}
      />
    </div>
  );
}
