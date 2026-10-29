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
import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';

/**
 * The price book's versions on the phone (`SCR-M01-15` s-versions, s-version-open): a full sheet
 * that lists them by year and opens one read-only in place, *Back to versions* before its title.
 */
export function VersionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useI18n();
  const formats = useCatalogFormats();
  const words = catalogVersionWords(t);
  const browse = usePriceBookBrowse(open, onClose);
  const opened =
    browse.picked !== null && browse.one.kind === 'ready' ? browse.one.value : undefined;
  const versions = browse.list.read.kind === 'ready' ? browse.list.read.value : [];
  const listTitle = opened === undefined;
  /* Android's Back from one version returns to the list, as *Back to versions* does; this handler is
     added after the sheet's own, so it runs first. */
  const { picked, back: toList } = browse;
  useEffect(() => {
    if (picked === null) return;
    const held = BackHandler.addEventListener('hardwareBackPress', () => {
      toList();
      return true;
    });
    return () => held.remove();
  }, [picked, toList]);
  const back =
    browse.picked === null ? undefined : (
      <IconButton label={t(PRICE_BOOK.backToVersions)} onClick={browse.back}>
        <ShellGlyph name="chevron-left" size="md" tone="primary" />
      </IconButton>
    );

  return (
    <EditorSurface
      open={open}
      onClose={browse.close}
      closeLabel={t(PRICE_BOOK.close)}
      showClose
      size="full"
      title={
        listTitle ? t(PRICE_BOOK.versions) : t(PRICE_BOOK.versionTitle, { number: opened.number })
      }
      subtitle={
        listTitle
          ? t(PRICE_BOOK.versionsCount, { count: browse.list.totalCount })
          : versionSummaryOf(t, opened, formats).byline
      }
      leading={back}
      meta={back === undefined ? undefined : <Chip>{words.readOnly}</Chip>}
    >
      <View>
        {browse.picked === null ? (
          <CatalogVersion
            mode="list"
            words={words}
            versions={versions.map((row) => versionSummaryOf(t, row, formats))}
            read={browse.list.read}
            onOpen={browse.pick}
            hasMore={browse.list.hasNextPage}
            onMore={() => void browse.list.fetchNextPage()}
          />
        ) : (
          <CatalogVersion
            mode="read"
            words={words}
            margin={opened ? formats.margin(opened.defaultMarginPct) : ''}
            rateCount={opened ? formats.number(opened.rates.length) : ''}
            note={opened?.note ?? ''}
            rates={versionRatesOf(opened?.rates ?? [], locale)}
            read={browse.one}
          />
        )}
      </View>
    </EditorSurface>
  );
}
