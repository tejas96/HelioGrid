import { type CatalogFacts, type CatalogOverlays, useReleasePreview } from '@heliogrid/data/react';
import {
  CATALOG_EDITOR,
  CATALOG_SETTINGS,
  catalogEditedItemOf,
  catalogPriceEditorWords,
  catalogPublishView,
  catalogReleaseWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  CatalogPriceEditor,
  CatalogRelease,
  catalogEditorSwitches,
  EditorSurface,
  Modal,
  useCatalogFormats,
} from '@heliogrid/ui';
import { ReleasesSheet } from './ReleasesSheet';
import { SheetFoot } from './SheetFoot';

type Release = CatalogFacts['release'];

/**
 * The Items panel's sheets on the phone (`SCR-M01-15` s-attrib, s-archive-confirm, s-publish,
 * s-contents): the price editor, the archive warning, the publish summary and the releases, each
 * over the list with its foot pinned. The bodies are the shared ones.
 */
export function ItemsSheets({
  sheets,
  schemes,
  release,
}: {
  sheets: CatalogOverlays;
  schemes: readonly string[];
  release: Release;
}) {
  return (
    <>
      <EditorSheet sheets={sheets} schemes={schemes} />
      <ArchiveAsk sheets={sheets} />
      <PublishSheet sheets={sheets} release={release} />
      <ReleasesSheet open={sheets.releasesOpen} onClose={sheets.closeReleases} />
    </>
  );
}

function EditorSheet({ sheets, schemes }: { sheets: CatalogOverlays; schemes: readonly string[] }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const { draft } = sheets;
  const item = draft.item;
  const platform = item?.source === 'platform_item';
  const taxStays = platform && draft.taxPct !== '' ? formats.percent(draft.taxPct) : null;
  return (
    <EditorSurface
      open={item !== null}
      onClose={draft.close}
      closeLabel={t(CATALOG_EDITOR.close)}
      showClose
      footer={
        <SheetFoot
          cancel={t(CATALOG_EDITOR.cancel)}
          onCancel={draft.close}
          act={t(platform ? CATALOG_EDITOR.saveOverride : CATALOG_EDITOR.savePrice)}
          onAct={() => void draft.save()}
          busy={draft.pending}
        />
      }
    >
      {item === null ? null : (
        <CatalogPriceEditor
          words={catalogPriceEditorWords(t, taxStays)}
          item={catalogEditedItemOf(t, item, schemes, formats)}
          amount={draft.amount}
          onAmount={draft.setAmount}
          taxPct={platform ? draft.taxPct : null}
          onTaxPct={draft.setTaxPct}
          taxOverridden={draft.taxPct !== ''}
          packRateMissing={item.tax?.source !== 'pack'}
          switches={platform ? catalogEditorSwitches(draft) : null}
          problem={draft.problem === null ? null : t(CATALOG_EDITOR.saveFailed)}
        />
      )}
    </EditorSurface>
  );
}

function ArchiveAsk({ sheets }: { sheets: CatalogOverlays }) {
  const { t } = useI18n();
  const asked = sheets.archiving;
  return (
    <Modal
      open={asked !== null}
      onClose={sheets.keep}
      closeLabel={t(CATALOG_EDITOR.close)}
      tone="warning"
      showClose={false}
      title={
        asked === null
          ? undefined
          : t(CATALOG_EDITOR.archiveTitle, { name: `${asked.item.brand} ${asked.item.model}` })
      }
      description={
        asked === null ? undefined : t(CATALOG_EDITOR.archiveDrafts, { count: asked.drafts })
      }
      footer={
        <SheetFoot
          cancel={t(CATALOG_EDITOR.keepIt)}
          onCancel={sheets.keep}
          act={t(CATALOG_EDITOR.archiveIt)}
          onAct={sheets.confirmArchive}
          destructive
        />
      }
    />
  );
}

function PublishSheet({ sheets, release }: { sheets: CatalogOverlays; release: Release }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const preview = useReleasePreview(sheets.publishing);
  const shown = catalogPublishView(
    t,
    {
      counts: preview.counts,
      lines: preview.lines.read.kind === 'ready' ? preview.lines.read.value : [],
    },
    sheets.publish.refusal,
    formats,
  );
  return (
    <EditorSurface
      open={sheets.publishing}
      onClose={sheets.closePublish}
      closeLabel={t(CATALOG_EDITOR.close)}
      showClose
      size="auto"
      title={t(CATALOG_EDITOR.publishTitle)}
      subtitle={
        release === null
          ? t(CATALOG_EDITOR.publishFirst)
          : t(CATALOG_EDITOR.publishReplaces, { label: release.label })
      }
      footer={
        <SheetFoot
          line={
            release === null || !shown.sendable
              ? null
              : t(CATALOG_EDITOR.staleCountAbsent, { label: release.label })
          }
          cancel={t(CATALOG_EDITOR.cancel)}
          onCancel={sheets.closePublish}
          act={t(CATALOG_SETTINGS.publish)}
          onAct={() => void sheets.sendPublish()}
          busy={sheets.publish.pending}
          off={sheets.label.trim() === '' || !shown.sendable}
        />
      }
    >
      <CatalogRelease
        mode="publish"
        words={catalogReleaseWords(t)}
        label={sheets.label}
        onLabel={sheets.setLabel}
        problem={shown.problem}
        changes={shown.changes}
        read={preview.lines.read}
        more={
          preview.lines.hasNextPage
            ? { label: shown.moreLabel, onMore: () => void preview.lines.fetchNextPage() }
            : null
        }
      />
    </EditorSurface>
  );
}
