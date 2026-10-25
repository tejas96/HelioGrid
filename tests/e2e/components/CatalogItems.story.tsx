import {
  type CatalogFilter,
  type CatalogSpec,
  NO_CATALOG_FILTER,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  CATALOG_EDITOR,
  CATALOG_SETTINGS,
  type CatalogRowFacts,
  catalogEditFailed,
  catalogItemsWords,
  catalogReleaseStripWords,
  catalogRowWords,
  catalogViewOnly,
  createTranslator,
} from '@heliogrid/i18n';
import { CatalogItems, type CatalogRow, type CatalogRowStatus, useFormat } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** The IN pack's two schemes (`F1-44`); a pack with none draws no compliance at all. */
const IN_SCHEMES = ['ALMM', 'DCR'] as const;

type Facts = CatalogRowFacts & { held: readonly string[]; archived: boolean };

const panel = (watt: number, technology: 'mono_perc' | 'topcon' | 'poly') =>
  ({ kind: 'panel', watt, technology }) as unknown as CatalogSpec;
const inverter = (acKw: number) =>
  ({ kind: 'inverter', acKw, mppt: { count: 2 }, phases: 1 }) as unknown as CatalogSpec;

/** The board's rows (`m15-a`, `m15-hidden`): an override, an own SKU, a platform item, a hidden one. */
const ROWS: readonly Facts[] = [
  {
    id: 'adani',
    brand: 'Adani Solar',
    model: 'AS-7-545',
    spec: panel(545, 'mono_perc'),
    layer: 'overridden',
    provenance: 'verified_datasheet',
    hidden: false,
    preferred: true,
    source: 'platform_item',
    amount: '14100',
    held: IN_SCHEMES,
    archived: false,
  },
  {
    id: 'rayzon',
    brand: 'Rayzon Solar',
    model: 'RS-550',
    spec: panel(550, 'topcon'),
    layer: 'own',
    provenance: 'tenant_provided',
    hidden: false,
    preferred: true,
    source: 'own_item',
    amount: '13600',
    held: ['ALMM'],
    archived: false,
  },
  {
    id: 'havells',
    brand: 'Havells',
    model: 'Enviro 5 kW',
    spec: inverter(5),
    layer: 'platform',
    provenance: 'verified_datasheet',
    hidden: false,
    preferred: true,
    source: 'platform_item',
    amount: null,
    held: [],
    archived: false,
  },
  {
    id: 'growatt',
    brand: 'Growatt',
    model: 'MIN 5000TL-X',
    spec: inverter(5),
    layer: 'platform',
    provenance: 'representative',
    hidden: true,
    preferred: false,
    source: 'platform_item',
    amount: null,
    held: [],
    archived: false,
  },
];

/** `s-archived`: an own SKU in the archived list, muted, with *Restore* only. */
const ARCHIVED: readonly Facts[] = [
  {
    id: 'rs335',
    brand: 'Rayzon Solar',
    model: 'RS-335',
    spec: panel(335, 'poly'),
    layer: 'own',
    provenance: 'tenant_provided',
    hidden: false,
    preferred: false,
    source: 'own_item',
    amount: '8200',
    held: ['ALMM'],
    archived: true,
  },
];

export type ItemsFrame =
  | 'normal'
  | 'search'
  | 'archived'
  | 'view-only'
  | 'teaching'
  | 'loading'
  | 'error'
  | 'edit-failed'
  | 'no-schemes';

/**
 * The Items panel as the page holds it, in `reader`'s language, for one board frame. A row asked
 * for reports as `data-opened`, an act as `data-acted`, *Try again* as `data-retried`.
 */
/** Which rows, schemes, grant and counts a frame shows. */
function frameOf(frame: ItemsFrame) {
  const fresh = frame === 'teaching' || frame === 'no-schemes';
  return {
    schemes: frame === 'no-schemes' ? [] : IN_SCHEMES,
    facts: frame === 'archived' ? ARCHIVED : frame === 'search' ? ROWS.slice(0, 1) : ROWS,
    administers: frame !== 'view-only',
    fresh,
    count: frame === 'archived' ? 23 : fresh ? 339 : 342,
  };
}

/** `s-error-edit`: the Growatt row's hide came back unsaved. */
function failedGrowatt(
  t: (typeof READERS)['en']['t'],
  setActed: (act: string) => void,
): Record<string, CatalogRowStatus> {
  return {
    growatt: {
      state: 'failed',
      label: t(CATALOG_EDITOR.hideFromPickers),
      reason: catalogEditFailed(t, 'shown'),
      onRetry: () => setActed('retry'),
      onDismiss: () => setActed('dismiss'),
    },
  };
}

export function CatalogItemsAsRead({ reader, frame }: { reader: UiLanguage; frame: ItemsFrame }) {
  const { t } = READERS[reader];
  const format = useFormat();
  const [opened, setOpened] = useState('');
  const [acted, setActed] = useState('');
  const [retried, setRetried] = useState(false);
  const [query, setQuery] = useState(frame === 'search' ? '545' : '');
  const [filter, setFilter] = useState<CatalogFilter>(
    frame === 'archived' ? { ...NO_CATALOG_FILTER, archived: true } : NO_CATALOG_FILTER,
  );
  const { schemes, facts, administers, fresh, count } = frameOf(frame);
  const rows: CatalogRow[] = facts.map((each) => ({
    id: each.id,
    kind: each.spec.kind,
    layer: each.layer,
    provenance: each.provenance,
    amount: each.amount,
    held: schemes.length === 0 ? [] : each.held,
    hidden: each.hidden,
    preferred: each.preferred,
    archived: each.archived,
    source: each.source,
    ...catalogRowWords(
      t,
      each,
      (n) => format.number(n),
      (a) => format.money(a),
    ),
  }));
  const words = catalogItemsWords(t, schemes, {
    count,
    matched: frame === 'search' ? rows.length : null,
    archived: frame === 'archived',
    fresh,
    preferredFirst: true,
  });
  const rowStates = frame === 'edit-failed' ? failedGrowatt(t, setActed) : {};
  const act = (name: string) => (row: CatalogRow) => setActed(`${name}:${row.id}`);
  return (
    <div
      lang={reader}
      data-opened={opened}
      data-acted={acted}
      data-retried={retried}
      style={{ padding: 16, maxWidth: 1104 }}
    >
      <CatalogItems
        words={words}
        surface={frame === 'loading' ? 'loading' : frame === 'error' ? 'error' : 'ready'}
        onRetry={() => setRetried(true)}
        strip={{
          ...catalogReleaseStripWords(
            t,
            fresh ? null : { label: 'r2026-08', since: '12 Aug' },
            administers,
          ),
          onLink: () => setActed('releases'),
          onAction: () => setActed('publish'),
        }}
        viewOnly={administers ? null : catalogViewOnly(t, ['Rajesh'])}
        teaching={fresh ? t(CATALOG_SETTINGS.teaching, { count }) : null}
        query={query}
        onQuery={setQuery}
        filter={filter}
        onFilter={setFilter}
        sort="preferred"
        onSort={(sort) => setActed(`sort:${sort}`)}
        schemes={schemes}
        rows={rows}
        rowStates={rowStates}
        paging={{
          kind: 'pages',
          page: 0,
          pageSize: 20,
          rowCount: count,
          onPage: (page) => setActed(`page:${page}`),
        }}
        archivedCaption={
          frame === 'normal' ? t(CATALOG_SETTINGS.archivedCaption, { count: 23 }) : null
        }
        administers={administers}
        onImport={administers ? () => undefined : null}
        onOpen={(row) => setOpened(row.id)}
        onPrefer={act('prefer')}
        onHide={act('hide')}
        onArchive={act('archive')}
        onRestore={act('restore')}
      />
    </div>
  );
}
