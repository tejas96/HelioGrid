import type {
  CatalogImportSummaryWire,
  CatalogImportWire,
  CatalogImportRowWire as Row,
} from '@heliogrid/contracts';
import {
  type CatalogSpec,
  type ComponentKind,
  type ImportWizardFrame,
  importContinueGate,
  mappingForHeader,
  type UiLanguage,
} from '@heliogrid/domain';
import { catalogImportWords, createTranslator } from '@heliogrid/i18n';
import { CatalogImport, type ImportLists, type ImportRowList, useFormat } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** The board's file (frame map §6): *Price list Aug 2026.xlsx*, three sheets, row 1 its header. */
const FILE_NAME = 'Price list Aug 2026.xlsx';
const HEADERS =
  'Item description|मॉडल क्रमांक|Rate|Wattage|GST %|HSN|Unit|Supplier code|Remarks'.split('|');
const SHEETS: NonNullable<CatalogImportWire['sheets']> = [
  { name: 'Price list', rowCount: 413, columnCount: 9, topRows: [HEADERS, ['Adani'], ['Vikram']] },
  { name: 'Notes', rowCount: 3, columnCount: 1, topRows: [['Prices valid till 30 Sep']] },
  { name: 'Discontinued 2025', rowCount: 18, columnCount: 3, topRows: [['Item', 'Rate']] },
];
const MAPPING = mappingForHeader(SHEETS, 0, 0);
const IMPORTED_AT = '2026-08-31T11:12:00.000Z';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
type Kind = ComponentKind;
const spec = (kind: Kind, size: number) =>
  (kind === 'panel'
    ? { kind, watt: size, technology: 'mono_perc' }
    : { kind, acKw: size, mppt: { count: 2 }, phases: 1 }) as unknown as CatalogSpec;
/** An item the row's brand and model named, as a question names it. */
const named = (n: number, brand: string, model: string, kind: Kind = 'panel', size = 545) => [
  {
    source: 'platform_item' as const,
    id: uuid(100 + n),
    brand,
    model,
    kind,
    spec: spec(kind, size),
  },
];
const rate = (amount: string, source: 'override' | 'own_item' = 'override') => ({
  ...{ source, amount, currencyCode: 'INR', effectiveOn: '2026-08-12' },
});

/** A row nothing has touched: every wire field at its rest. */
const AT_REST = {
  ...{ fix: {}, leftOut: false, answer: null, outcome: 'price_override', attention: [] },
  ...{ match: null, named: [], repeats: null, filePrice: null, catalogPrice: null },
  ...{ result: null, failure: null, priceBefore: null, priceApplied: null },
};
type Cells = readonly [string, string, Record<string, string>?];
const row = (rowNumber: number, [brand, model, cell]: Cells, over: Partial<Row> = {}): Row => ({
  ...{ ...AT_REST, rowNumber, cells: { brand, model, ...cell }, ...over },
});
const ask = (reason: string, ...fields: string[]) => ({
  ...{ outcome: 'needs_attention', attention: [{ reason, fields }] },
});

/** *Need you* (m17-c): the board's seven flagged rows. */
const POLYCAB_CELLS: Cells = ['Polycab', '6 sq mm DC cable, per metre', { rate: '' }];
const FLAGGED: readonly Row[] = [
  row(11, POLYCAB_CELLS, ask('price_missing', 'rate')),
  row(14, ['Havells', 'ACDB 1-in 1-out', { rate: '2,380/pc' }], ask('price_unreadable', 'rate')),
  row(19, ['Rayzon Solar', 'RSM-550', { watt: '550', rate: '13900' }], {
    ...{ ...ask('spec_conflict', 'watt'), named: named(19, 'Rayzon Solar', 'RSM-550') },
  }),
  row(52, ['Waaree', 'WSMD-540'], {
    ...ask('several_matches'),
    named: [
      ...named(52, 'Waaree', 'WSMD-540', 'panel', 540),
      ...named(53, 'Waaree', 'WSMD-540', 'inverter', 5),
    ],
  }),
  row(143, ['SPD', 'Type 2, 1000 V DC'], ask('kind_missing', 'kind')),
  row(266, ['Luminous', 'LPTT12150H 150 Ah', { rate: '-13,900' }], {
    ...{ ...ask('price_below_zero', 'rate'), filePrice: '-13900' },
  }),
  row(390, ['Secure', 'Elite 301 net meter', { rate: '7400' }], {
    ...{ ...ask('repeated_in_file'), repeats: { rowNumber: 388, filePrice: '7250' } },
  }),
];

/** Row 11 as the person's ₹104 leaves it (m17-m): ready to import as an override. */
const POLYCAB_FIXED = row(11, POLYCAB_CELLS, { fix: { rate: '104' }, filePrice: '104' });

const VIKRAM = row(3, ['Vikram Solar', 'Somera 540 Wp mono PERC'], {
  ...{ named: named(3, 'Vikram Solar', 'Somera 540', 'panel', 540), filePrice: '14320' },
});
const ADANI = row(5, ['Adani Solar', 'AS-7-545'], {
  ...{ named: named(5, 'Adani Solar', 'AS-7-545'), filePrice: '14050' },
  catalogPrice: rate('14100'),
});
const RAYZON_OWN = row(6, ['Rayzon Solar', 'RS-550 550 Wp TOPCon'], {
  ...{ outcome: 'own_item_price', filePrice: '13450', catalogPrice: rate('13600', 'own_item') },
  named: named(6, 'Rayzon Solar', 'RS-550', 'panel', 550).map((item) => ({
    ...item,
    source: 'own_item',
  })),
});
const NEW = { outcome: 'new_item' };
const RAYZON_NEW = row(7, ['Rayzon Solar', 'RSM-580 580 Wp TOPCon'], {
  ...NEW,
  filePrice: '16240',
});
const ELMEX_NEW = row(41, ['Elmex', 'MC4 connector pair'], { ...NEW, filePrice: '165' });

const list = (rows: readonly Row[], total = rows.length): ImportRowList => ({
  ...{ rows, total, loading: false, hasMore: false, onMore: () => undefined },
});

const PREVIEW: ImportLists = {
  attention: list(FLAGGED),
  groups: [
    { id: 'overrides', ...list([VIKRAM, ADANI, RAYZON_OWN], 318) },
    { id: 'newItems', ...list([RAYZON_NEW, ELMEX_NEW], 87) },
  ],
  found: null,
};
const FOUND = { attention: list(FLAGGED.slice(2, 3)), ready: list([RAYZON_OWN, RAYZON_NEW]) };

/** The report (m17-o): two failed, seven left out, the written groups folded. */
const written = (each: Row, result: string) => ({
  ...{ ...each, result, priceBefore: each.catalogPrice },
  priceApplied: each.filePrice === null ? null : rate(each.filePrice),
});
const FAILED = [
  row(8, ['Growatt', 'MIN 5000TL-X 5 kW'], {
    ...{ result: 'failed', failure: 'changed_since_preview', filePrice: '30900' },
    named: named(8, 'Growatt', 'MIN 5000TL-X', 'inverter', 5),
  }),
  row(233, ['Elmex', 'MC4 connector, 6 mm'], {
    ...{ ...NEW, result: 'failed', failure: 'not_applied', filePrice: '170' },
  }),
];
const LEFT_OUT = FLAGGED.slice(0, 3).map((each) => ({ ...each, result: 'left_out' }));
const APPLIED = [written(VIKRAM, 'price_applied'), written(ADANI, 'price_applied')];
const REPORT: ImportLists = {
  attention: null,
  groups: [
    { id: 'failed', ...list(FAILED) },
    { id: 'leftOut', ...list(LEFT_OUT, 7) },
    { id: 'applied', ...list(APPLIED, 317) },
    { id: 'created', ...list([written(RAYZON_NEW, 'product_created')], 86) },
  ],
  found: null,
};

/** *Kept reports* (m17-k): the two the board lists, newest first. */
const KEPT: readonly CatalogImportSummaryWire[] = [
  [FILE_NAME, '2026-08-12'],
  ['Price list Jun 2026.xlsx', '2026-06-20'],
].map(([fileName = '', day = ''], index) => ({
  ...{ id: uuid(index + 1), status: 'completed', entryPoint: 'settings', fileName },
  ...{ savedAt: `${day}T06:30:00.000Z`, startedBy: uuid(9), createdAt: `${day}T06:31:00.000Z` },
}));

const COUNTS = { rows: 412, matched: 318, newItems: 87, needsAttention: 7, leftOut: 0 };
const COUNTS_FIXED = { ...COUNTS, matched: 319, needsAttention: 6 };
const RESULTS = { priceApplied: 317, productCreated: 86, leftOut: 7, failed: 2 };
const SPREADSHEET = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** The job as the server reports it at a frame. */
function jobOf(status: CatalogImportWire['status'], fixedOne: boolean): CatalogImportWire {
  const unreadable = status === 'unreadable';
  const ran = status === 'running' || status === 'completed';
  const done = status === 'running' ? 218 : 405;
  return {
    ...{ id: uuid(1), status, entryPoint: 'settings', fileName: FILE_NAME },
    ...{ savedAt: KEPT[0]?.savedAt ?? null, startedBy: uuid(9), createdAt: IMPORTED_AT },
    unreadableReason: unreadable ? 'cannot_open' : null,
    file: { id: uuid(3), contentType: SPREADSHEET, byteSize: 184_320 },
    sheets: unreadable ? null : SHEETS,
    mapping: unreadable ? null : { ...MAPPING, columns: [...MAPPING.columns] },
    counts: status === 'previewed' || ran ? (fixedOne ? COUNTS_FIXED : COUNTS) : null,
    run: ran ? { done, total: 405, at: IMPORTED_AT, by: uuid(9) } : null,
    results: status === 'completed' ? RESULTS : null,
  };
}

type Setup = { frame: ImportWizardFrame; status: CatalogImportWire['status'] | null } & Partial<{
  lists: ImportLists;
  scope: string;
  query: string;
  fixedOne: boolean;
  opening: boolean;
}>;

const PREVIEWED = { frame: 'preview', status: 'previewed', lists: PREVIEW } as const;
const SCOPED = { ...PREVIEWED, scope: 'attention', fixedOne: true };
const SCOPED_LISTS = { ...PREVIEW, attention: list(FLAGGED.slice(1)) };
const REPORTED = { frame: 'report', status: 'completed', lists: REPORT } as const;

/** What each board frame holds; m17-d, m17-e and m17-h are m17-c's, opened by the spec's press. */
const SETUPS = {
  'm17-k': { frame: 'empty', status: null },
  'm17-l': { frame: 'unreadable', status: 'unreadable' },
  'm17-a': { frame: 'file', status: 'mapped' },
  'm17-b': { frame: 'columns', status: 'mapped' },
  'm17-i': { frame: 'matching', status: 'matching' },
  'm17-c': PREVIEWED,
  'm17-d': PREVIEWED,
  'm17-r': { ...PREVIEWED, query: 'Rayzon', lists: { ...PREVIEW, found: FOUND } },
  'm17-m': { ...SCOPED, lists: SCOPED_LISTS },
  'm17-e': PREVIEWED,
  'm17-n': { frame: 'running', status: 'running' },
  'm17-j': { ...REPORTED, opening: true },
  'm17-o': REPORTED,
  'm17-f': { frame: 'file', status: 'mapped' },
  'm17-g': { frame: 'columns', status: 'mapped' },
  'm17-h': PREVIEWED,
  'm17-p': { ...SCOPED, lists: SCOPED_LISTS },
  'm17-q': REPORTED,
} as const satisfies Record<string, Setup>;

export type ImportBoardFrame = keyof typeof SETUPS;

const NO_LISTS: ImportLists = { attention: null, groups: [], found: null };

/**
 * The wizard as the import panel holds it, in `reader`'s language, at one board frame. What the
 * spec cannot import or format itself rides the wrapper: the file's name and header cells, the
 * fixed card's line and the report's stamp. A press reports as `data-acted`.
 */
export function CatalogImportAsRead({
  reader,
  frame,
}: {
  reader: UiLanguage;
  frame: ImportBoardFrame;
}) {
  const { t } = READERS[reader];
  const format = useFormat();
  const words = catalogImportWords(t);
  const setup: Setup = SETUPS[frame];
  const [scope, setScope] = useState(setup.scope ?? null);
  const [query, setQuery] = useState(setup.query ?? '');
  const [acted, setActed] = useState('');
  const job = setup.status === null ? null : jobOf(setup.status, setup.fixedOne === true);
  const mapping = job === null || job.mapping === null ? null : MAPPING;
  const fixed = new Map(setup.fixedOne ? [[11, { row: POLYCAB_FIXED }]] : []);
  const act = (name: string) => () => setActed(name);
  return (
    <div
      lang={reader}
      data-acted={acted}
      data-file={FILE_NAME}
      data-headers={JSON.stringify(HEADERS)}
      data-fixed-line={words.fixedLine('price', format.money(104))}
      data-stamp={words.stamp(format.date(IMPORTED_AT), format.clockAt(IMPORTED_AT))}
    >
      <CatalogImport
        open
        onClose={act('close')}
        words={words}
        frame={setup.frame}
        job={job}
        opening={setup.opening === true}
        safeTop={0}
        upload={{
          state: 'idle',
          accept: '.xlsx,.csv',
          maxSizeMB: 2,
          message: null,
          onRetry: act('retry'),
        }}
        onFiles={act('files')}
        onReplace={act('replace')}
        mapping={mapping}
        onSheet={act('sheet')}
        onHeaderRow={act('header-row')}
        kept={{ rows: KEPT, hasMore: false, onMore: act('more') }}
        onOpenKept={act('kept')}
        onPlace={act('place')}
        lists={setup.lists ?? NO_LISTS}
        scope={scope}
        onScope={(group) => setScope((now) => (now === group ? null : group))}
        query={query}
        onQuery={setQuery}
        fixed={fixed}
        busy={new Set()}
        onFix={act('fix')}
        onUndo={act('undo')}
        gate={importContinueGate(setup.frame, mapping?.columns ?? [])}
        onBack={act('back')}
        onContinue={act('continue')}
        onRun={act('run')}
        onStopWatching={act('stop-watching')}
        onFixOpenRows={act('fix-open-rows')}
        notice={null}
      />
    </div>
  );
}
