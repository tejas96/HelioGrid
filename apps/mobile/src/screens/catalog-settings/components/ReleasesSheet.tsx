import type { CatalogReleasesBrowse } from '@heliogrid/data/react';
import { CATALOG_EDITOR, catalogReleaseChangesOf, catalogReleaseWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogRelease, EditorSurface, useCatalogFormats } from '@heliogrid/ui';

/** The releases, newest first, opened as the newest's before-and-after with the earlier ones under it. */
export function ReleasesSheet({ releases }: { releases: CatalogReleasesBrowse }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const read = releases.opened;
  const opened = read.kind === 'ready' ? read.value : undefined;
  const head = opened?.release;
  return (
    <EditorSurface
      open={releases.open}
      onClose={releases.close}
      closeLabel={t(CATALOG_EDITOR.close)}
      showClose
      size="full"
      title={t(CATALOG_EDITOR.releases)}
      subtitle={t(CATALOG_EDITOR.releasesCount, { count: releases.totalCount })}
    >
      <CatalogRelease
        mode="contents"
        words={catalogReleaseWords(t)}
        release={
          head === undefined
            ? null
            : {
                tag: head.label,
                when: t(CATALOG_EDITOR.inForceSince, { date: formats.date(head.publishedAt) }),
                inForce: head.id === releases.newestId,
              }
        }
        changes={
          opened
            ? catalogReleaseChangesOf(t, opened.release.counts, opened.lines.items, formats)
            : null
        }
        read={read}
        earlier={releases.listed.flatMap((entry) =>
          entry.id === releases.openedId
            ? []
            : [{ id: entry.id, tag: entry.label, when: formats.date(entry.publishedAt) }],
        )}
        onOpenEarlier={releases.choose}
      />
    </EditorSurface>
  );
}
