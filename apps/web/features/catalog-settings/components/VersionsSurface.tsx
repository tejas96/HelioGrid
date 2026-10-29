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
  const read = browse.picked !== null && browse.one.kind === 'ready' ? browse.one.value : undefined;
  const listing = read === undefined;
  const versions = browse.list.read.kind === 'ready' ? browse.list.read.value : [];

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
          versions={versions.map((summary) => versionSummaryOf(t, summary, formats))}
          read={browse.list.read}
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
          read={browse.one}
        />
      )}
    </EditorSurface>
  );
}
