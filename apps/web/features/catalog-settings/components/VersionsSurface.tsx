'use client';
import { usePriceBookBrowse } from '@heliogrid/data/react';
import { catalogVersionWords, PRICE_BOOK, versionRatesOf, versionSummaryOf } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  CatalogVersion,
  Chip,
  EditorSurface,
  IconButton,
  ShellGlyph,
  surfaceOf,
  useCatalogFormats,
} from '@heliogrid/ui';

/**
 * The price book's versions on the web (`SCR-M01-15` d-versions, d-version-open): the list by
 * year, then one past version read-only — *Back to versions* before its title, *Read-only* on
 * the line under it, never greyed. Beside the Rates table at 1536, a sheet below.
 */
export function VersionsSurface({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useI18n();
  const formats = useCatalogFormats();
  const words = catalogVersionWords(t);
  const browse = usePriceBookBrowse(open, onClose);
  const read = browse.picked === null ? undefined : browse.one.data;
  const listing = read === undefined;

  return (
    <EditorSurface
      open={open}
      onClose={browse.close}
      closeLabel={t(PRICE_BOOK.close)}
      showClose
      title={listing ? t(PRICE_BOOK.versions) : t(PRICE_BOOK.versionTitle, { number: read.number })}
      subtitle={
        listing
          ? t(PRICE_BOOK.versionsCount, { count: browse.list.totalCount })
          : versionSummaryOf(t, read, formats).byline
      }
      subtitleFace="sans"
      leading={
        browse.picked === null ? undefined : (
          <IconButton label={t(PRICE_BOOK.backToVersions)} onClick={browse.back}>
            <ShellGlyph name="chevron-left" size="md" tone="primary" />
          </IconButton>
        )
      }
      meta={browse.picked === null ? undefined : <Chip>{words.readOnly}</Chip>}
    >
      {browse.picked === null ? (
        <CatalogVersion
          mode="list"
          words={words}
          versions={browse.list.items.map((summary) => versionSummaryOf(t, summary, formats))}
          surface={surfaceOf(browse.list.status)}
          onRetry={() => void browse.list.refetch()}
          onOpen={browse.pick}
          hasMore={browse.list.hasNextPage}
          onMore={() => void browse.list.fetchNextPage()}
        />
      ) : (
        <CatalogVersion
          mode="read"
          words={words}
          margin={read ? formats.margin(read.defaultMarginPct) : ''}
          rateCount={read ? formats.number(read.rates.length) : ''}
          note={read?.note ?? ''}
          rates={versionRatesOf(read?.rates ?? [], locale)}
          surface={surfaceOf(browse.one.status)}
          onRetry={() => void browse.one.refetch()}
        />
      )}
    </EditorSurface>
  );
}
