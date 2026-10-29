'use client';
import { useCatalogRates } from '@heliogrid/data/react';
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
import { RateSheet } from './RateSheet';
import { VersionsSurface } from './VersionsSurface';

type Toasts = ReturnType<typeof useToasts>;

/**
 * The Rates panel on the web (`SCR-M01-15`, `M01-48`): the price book's version in force, the
 * versions read-only, and a new version written whole. What it draws is `useCatalogRates`'s, the
 * phone's too.
 */
export function RatesPanel({ administers, toasts }: { administers: boolean; toasts: Toasts }) {
  const { t, locale } = useI18n();
  const formats = useCatalogFormats();
  const rates = useCatalogRates(administers, (number) =>
    toasts.push({ tone: 'success', title: t(PRICE_BOOK.saved, { number }) }),
  );
  const { draft, next, inForce } = rates;
  const version = inForce?.version ?? null;
  const strip = {
    ...priceBookStripWords(
      t,
      version === null || inForce === undefined
        ? null
        : {
            number: version.number,
            margin: formats.margin(inForce.defaultMarginPct),
            since: formats.date(version.publishedAt),
          },
      administers,
    ),
    onLink: rates.versions.show,
    onAction: rates.start,
  };

  return (
    <>
      <CatalogRates
        words={catalogRatesWords(t)}
        read={rates.book}
        strip={strip}
        rates={versionRatesOf(inForce?.rates ?? [], locale)}
        onAddFirst={rates.addFirst}
      />
      <VersionsSurface browse={rates.versions} />
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
                onClick={() => void rates.publish()}
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
