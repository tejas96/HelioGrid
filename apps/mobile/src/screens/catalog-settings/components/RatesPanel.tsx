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
  CatalogRates,
  CatalogVersion,
  EditorSurface,
  useCatalogFormats,
  type useToasts,
} from '@heliogrid/ui';
import { useState } from 'react';
import { RateSheet } from './RateSheet';
import { SheetFoot } from './SheetFoot';
import { VersionsSheet } from './VersionsSheet';

/**
 * The Rates panel on the phone (`SCR-M01-15` m15-d, s-versions, s-version-new): the version in
 * force grouped by how each rate is charged, the versions in a sheet, and a new version written
 * whole in a full sheet. `usePriceBook` reads, `usePriceBookDraft` writes.
 */
export function RatesPanel({
  administers,
  toasts,
}: {
  administers: boolean;
  toasts: ReturnType<typeof useToasts>;
}) {
  const { t, locale } = useI18n();
  const formats = useCatalogFormats();
  const book = usePriceBook();
  const draft = usePriceBookDraft();
  const [browsing, setBrowsing] = useState(false);
  const inForce = book.data;
  const head = inForce?.version ?? null;
  const begin = () => {
    if (inForce) draft.start(inForce);
  };
  const next = (draft.from ?? 0) + 1;
  const save = () =>
    void draft.publish().then((number) => {
      if (number !== null) toasts.push({ tone: 'success', title: t(PRICE_BOOK.saved, { number }) });
    });

  return (
    <>
      <CatalogRates
        words={catalogRatesWords(t)}
        surface={book.isError ? 'error' : inForce ? 'ready' : 'loading'}
        onRetry={() => void book.refetch()}
        strip={{
          ...priceBookStripWords(
            t,
            head && inForce
              ? {
                  number: head.number,
                  margin: formats.margin(inForce.defaultMarginPct),
                  since: formats.date(head.publishedAt),
                }
              : null,
            administers,
          ),
          onLink: () => setBrowsing(true),
          onAction: begin,
        }}
        rates={versionRatesOf(inForce?.rates ?? [], locale)}
        onAddFirst={administers && head === null ? begin : null}
      />
      <VersionsSheet open={browsing} onClose={() => setBrowsing(false)} />
      <EditorSurface
        open={draft.open}
        onClose={draft.close}
        closeLabel={t(PRICE_BOOK.close)}
        showClose
        size="full"
        title={t(PRICE_BOOK.versionTitle, { number: next })}
        subtitle={
          draft.from === null
            ? t(PRICE_BOOK.startsFresh)
            : t(PRICE_BOOK.startsFrom, { number: draft.from })
        }
        footer={
          <SheetFoot
            line={
              draft.from === null
                ? t(PRICE_BOOK.firstInForce)
                : t(PRICE_BOOK.inForceAtOnce, { next, current: draft.from })
            }
            cancel={t(PRICE_BOOK.cancel)}
            onCancel={draft.close}
            act={t(PRICE_BOOK.saveAs, { number: next })}
            onAct={save}
            busy={draft.publishing.busy}
            off={draft.incomplete}
          />
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
            ...versionRowWords(t, rate, locale, formats.money),
            key: rate.key,
            basis: rate.basis,
            amount: rate.amount,
            onOpen: () => draft.edit(rate.key),
            onAmount: (amount: string) => draft.setAmount(rate.key, amount),
          }))}
          onAddRate={draft.addRate}
          noteHint={draft.noteMissing ? t(PRICE_BOOK.noteNeeded) : null}
          problem={draft.publishing.failed ? t(PRICE_BOOK.saveFailed) : null}
        />
      </EditorSurface>
      <RateSheet draft={draft} />
    </>
  );
}
