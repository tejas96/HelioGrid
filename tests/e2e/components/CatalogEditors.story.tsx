import type { UiLanguage } from '@heliogrid/domain';
import {
  CATALOG_EDITOR,
  catalogKind,
  catalogPriceEditorWords,
  catalogReleaseWords,
  catalogTechnology,
  createTranslator,
  releaseChangeWord,
} from '@heliogrid/i18n';
import {
  CatalogPriceEditor,
  CatalogRelease,
  type CatalogReleaseChanges,
  useFormat,
} from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** The IN pack's two schemes (`F1-44`); a pack with none draws no compliance at all. */
const IN_SCHEMES = ['ALMM', 'DCR'] as const;

/** `s-attrib` / `d-attrib`: a platform panel with the tenant's price and 5% tax, no market rate. */
export function PriceEditorAsRead({ reader }: { reader: UiLanguage }) {
  const { t } = READERS[reader];
  const [amount, setAmount] = useState('14900');
  const [hidden, setHidden] = useState(false);
  return (
    <div
      lang={reader}
      data-amount={amount}
      data-hidden={hidden}
      style={{ padding: 16, maxWidth: 480 }}
    >
      <CatalogPriceEditor
        words={catalogPriceEditorWords(t, '5%')}
        item={{
          overline: t(CATALOG_EDITOR.platformItem),
          name: 'Premier Energies PE-M550',
          chips: [catalogKind(t, 'panel'), '550 Wp', catalogTechnology(t, 'topcon')],
          held: IN_SCHEMES,
        }}
        amount={amount}
        onAmount={setAmount}
        taxPct="5"
        onTaxPct={() => undefined}
        taxOverridden
        packRateMissing
        switches={{
          hidden,
          onHidden: setHidden,
          hiddenFromOverride: false,
          preferred: false,
          onPreferred: () => undefined,
          preferredFromOverride: false,
        }}
        problem={null}
      />
    </div>
  );
}

/** A release's before-and-after: the publish summary, or a published release with the earlier two. */
export function ReleaseAsRead({
  reader,
  mode,
}: {
  reader: UiLanguage;
  mode: 'publish' | 'contents';
}) {
  const { t } = READERS[reader];
  const format = useFormat();
  const [label, setLabel] = useState('September price update');
  const [opened, setOpened] = useState('');
  const words = catalogReleaseWords(t);
  const changes: CatalogReleaseChanges = {
    counts: [
      { kind: 'added', count: 2, word: releaseChangeWord(t, 'added') },
      { kind: 'changed', count: 1, word: releaseChangeWord(t, 'changed') },
    ],
    items: [
      {
        id: 'premier',
        name: 'Premier Energies PE-M550',
        kind: 'added',
        fields: [
          { field: t(CATALOG_EDITOR.price), from: null, to: format.money('14900'), figure: true },
        ],
      },
      {
        id: 'exide',
        name: 'Exide Solar Tubular 150 Ah',
        kind: 'added',
        fields: [
          { field: t(CATALOG_EDITOR.price), from: null, to: format.money('16800'), figure: true },
        ],
      },
      {
        id: 'havells',
        name: 'Havells Enviro 5 kW',
        kind: 'changed',
        fields: [
          {
            field: t(CATALOG_EDITOR.preferred),
            from: t(CATALOG_EDITOR.no),
            to: t(CATALOG_EDITOR.yes),
            figure: false,
          },
        ],
      },
    ],
  };
  return (
    <div lang={reader} data-opened={opened} style={{ padding: 16, maxWidth: 520 }}>
      {mode === 'publish' ? (
        <CatalogRelease
          mode="publish"
          words={words}
          label={label}
          onLabel={setLabel}
          problem={null}
          changes={changes}
          more={null}
          read={{ kind: 'ready', value: null }}
        />
      ) : (
        <CatalogRelease
          mode="contents"
          words={words}
          release={{ tag: 'r2026-08', when: '12 Aug 2026', inForce: true }}
          changes={changes}
          read={{ kind: 'ready', value: null }}
          earlier={[
            { id: 'r6', tag: 'r2026-06', when: '9 Jun 2026' },
            { id: 'r3', tag: 'r2026-03', when: '4 Mar 2026' },
          ]}
          onOpenEarlier={setOpened}
        />
      )}
    </div>
  );
}
