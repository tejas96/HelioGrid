'use client';
import type { CatalogReleasesBrowse } from '@heliogrid/data/react';
import { CATALOG_EDITOR, catalogReleaseChangesOf, catalogReleaseWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogRelease, EditorSurface, useCatalogFormats } from '@heliogrid/ui';

/** The releases, newest first: the newest opened as its before-and-after, the earlier ones under it. */
export function ReleasesSurface({ releases }: { releases: CatalogReleasesBrowse }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const detail = releases.opened;
  const opened = detail.kind === 'ready' ? detail.value : undefined;
  return (
    <EditorSurface
      open={releases.open}
      onClose={releases.close}
      closeLabel={t(CATALOG_EDITOR.close)}
      showClose
      title={t(CATALOG_EDITOR.releases)}
      subtitle={t(CATALOG_EDITOR.releasesCount, { count: releases.totalCount })}
      subtitleFace="sans"
    >
      <CatalogRelease
        mode="contents"
        words={catalogReleaseWords(t)}
        release={
          opened === undefined
            ? null
            : {
                tag: opened.release.label,
                when: t(CATALOG_EDITOR.inForceSince, {
                  date: formats.date(opened.release.publishedAt),
                }),
                inForce: opened.release.id === releases.newestId,
              }
        }
        changes={
          opened === undefined
            ? null
            : catalogReleaseChangesOf(t, opened.release.counts, opened.lines.items, formats)
        }
        read={detail}
        earlier={releases.listed
          .filter((entry) => entry.id !== releases.openedId)
          .map((entry) => ({
            id: entry.id,
            tag: entry.label,
            when: formats.date(entry.publishedAt),
          }))}
        onOpenEarlier={releases.choose}
      />
    </EditorSurface>
  );
}
