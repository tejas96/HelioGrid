'use client';
import { useCatalogRelease, useCatalogReleases } from '@heliogrid/data/react';
import { CATALOG_EDITOR, catalogReleaseChangesOf, catalogReleaseWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogRelease, EditorSurface, useCatalogFormats } from '@heliogrid/ui';
import { useState } from 'react';

/** The releases, newest first: the newest opened as its before-and-after, the earlier ones under it. */
export function ReleasesSurface({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const releases = useCatalogReleases(open);
  const [chosen, setChosen] = useState<string | null>(null);
  const newest = releases.items[0];
  const shown = chosen ?? newest?.id ?? null;
  const detail = useCatalogRelease(open ? shown : null);
  const opened = detail.data?.release;
  return (
    <EditorSurface
      open={open}
      onClose={() => {
        setChosen(null);
        onClose();
      }}
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
                tag: opened.label,
                when: t(CATALOG_EDITOR.inForceSince, { date: formats.date(opened.publishedAt) }),
                inForce: opened.id === newest?.id,
              }
        }
        changes={
          detail.data === undefined
            ? null
            : catalogReleaseChangesOf(
                t,
                detail.data.release.counts,
                detail.data.lines.items,
                formats,
              )
        }
        surface={detail.isError ? 'error' : detail.data === undefined ? 'loading' : 'ready'}
        onRetry={() => void detail.refetch()}
        earlier={releases.items
          .filter((entry) => entry.id !== shown)
          .map((entry) => ({
            id: entry.id,
            tag: entry.label,
            when: formats.date(entry.publishedAt),
          }))}
        onOpenEarlier={setChosen}
      />
    </EditorSurface>
  );
}
