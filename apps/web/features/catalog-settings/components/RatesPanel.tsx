'use client';
import { usePriceBook, usePriceBookDraft } from '@heliogrid/data/react';
import {
  catalogRatesWords,
  catalogVersionWords,
  PRICE_BOOK,
  priceBookStripWords,
  versionRatesOf,
  versionRowWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  Button,
  CATALOG_VERSION_PANEL_WIDTH,
  CatalogRates,
  CatalogVersion,
  EditorSurface,
  Text,
  useCatalogFormats,
  type useToasts,
} from '@heliogrid/ui';
import { useState } from 'react';
import { RateSheet } from './RateSheet';
import { VersionsSurface } from './VersionsSurface';

type Toasts = ReturnType<typeof useToasts>;

/**
 * The Rates panel on the web (`SCR-M01-15`, `M01-48`): the price book's version in force, the
 * versions read-only, and a new version written whole. `usePriceBook` reads, `usePriceBookDraft`
 * writes; this composes.
 */
export function RatesPanel({ administers, toasts }: { administers: boolean; toasts: Toasts }) {
  const { t, locale } = useI18n();
  const formats = useCatalogFormats();
  const book = usePriceBook();
  const draft = usePriceBookDraft();
  const [versionsOpen, setVersionsOpen] = useState(false);
  const active = book.kind === 'ready' ? book.value : undefined;
  const version = active?.version ?? null;
  const start = () => {
    if (active !== undefined) draft.start(active);
  };
  const strip = {
    ...priceBookStripWords(
      t,
      version === null || active === undefined
        ? null
        : {
            number: version.number,
            margin: formats.margin(active.defaultMarginPct),
            since: formats.date(version.publishedAt),
          },
      administers,
    ),
    onLink: () => setVersionsOpen(true),
    onAction: start,
  };
  const save = async () => {
    const number = await draft.publish();
    if (number !== null) toasts.push({ tone: 'success', title: t(PRICE_BOOK.saved, { number }) });
  };
  const next = (draft.from ?? 0) + 1;

  return (
    <>
      <CatalogRates
        words={catalogRatesWords(t)}
        read={book}
        strip={strip}
        rates={versionRatesOf(active?.rates ?? [], locale)}
        onAddFirst={administers && version === null ? start : null}
      />
      <VersionsSurface open={versionsOpen} onClose={() => setVersionsOpen(false)} />
      <EditorSurface
        open={draft.open}
        onClose={draft.close}
        closeLabel={t(PRICE_BOOK.close)}
        showClose
        width={CATALOG_VERSION_PANEL_WIDTH}
        title={t(PRICE_BOOK.versionTitle, { number: next })}
        subtitle={
          draft.from === null
            ? t(PRICE_BOOK.startsFresh)
            : t(PRICE_BOOK.startsFrom, { number: draft.from })
        }
        subtitleFace="sans"
        footer={
          <div className="hg-catalog-foot-stack">
            <Text variant="caption" color="secondary">
              {draft.from === null
                ? t(PRICE_BOOK.firstInForce)
                : t(PRICE_BOOK.inForceAtOnce, { next, current: draft.from })}
            </Text>
            <div className="hg-catalog-foot">
              <Button variant="secondary" size="lg" fullWidth onClick={draft.close}>
                {t(PRICE_BOOK.cancel)}
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={draft.publishing.pending}
                disabled={draft.incomplete}
                onClick={() => void save()}
              >
                {t(PRICE_BOOK.saveAs, { number: next })}
              </Button>
            </div>
          </div>
        }
      >
        <CatalogVersion
          mode="edit"
          words={catalogVersionWords(t)}
          margin={draft.margin}
          onMargin={draft.setMargin}
          note={draft.note}
          onNote={draft.setNote}
          rows={draft.rows.map((rate) => ({
            key: rate.key,
            ...versionRowWords(t, rate, locale, formats.money),
            onOpen: () => draft.edit(rate.key),
            basis: rate.basis,
            amount: rate.amount,
            onAmount: (amount: string) => draft.setAmount(rate.key, amount),
          }))}
          onAddRate={draft.addRate}
          noteHint={draft.noteMissing ? t(PRICE_BOOK.noteNeeded) : null}
          problem={draft.publishing.failure === null ? null : t(PRICE_BOOK.saveFailed)}
        />
      </EditorSurface>
      <RateSheet draft={draft} />
    </>
  );
}
