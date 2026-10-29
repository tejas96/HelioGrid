import { useCatalogRelease, useCatalogReleases } from '@heliogrid/data/react';
import { CATALOG_EDITOR, catalogReleaseChangesOf, catalogReleaseWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogRelease, EditorSurface, useCatalogFormats } from '@heliogrid/ui';
import { useState } from 'react';

/** The releases, newest first, opened as the newest's before-and-after with the earlier ones under it. */
export function ReleasesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const list = useCatalogReleases(open);
  const [picked, setPicked] = useState<string | null>(null);
  const listed = list.read.kind === 'ready' ? list.read.value : [];
  const newestId = listed[0]?.id ?? null;
  const openId = picked ?? newestId;
  const read = useCatalogRelease(open ? openId : null);
  const opened = read.kind === 'ready' ? read.value : undefined;
  const head = opened?.release;
  const shut = () => {
    setPicked(null);
    onClose();
  };
  return (
    <EditorSurface
      open={open}
      onClose={shut}
      closeLabel={t(CATALOG_EDITOR.close)}
      showClose
      size="full"
      title={t(CATALOG_EDITOR.releases)}
      subtitle={t(CATALOG_EDITOR.releasesCount, { count: list.totalCount })}
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
                inForce: head.id === newestId,
              }
        }
        changes={
          opened
            ? catalogReleaseChangesOf(t, opened.release.counts, opened.lines.items, formats)
            : null
        }
        read={read}
        earlier={listed.flatMap((entry) =>
          entry.id === openId
            ? []
            : [{ id: entry.id, tag: entry.label, when: formats.date(entry.publishedAt) }],
        )}
        onOpenEarlier={setPicked}
      />
    </EditorSurface>
  );
}
