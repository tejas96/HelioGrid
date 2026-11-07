'use client';
import type { TranslatedText } from '@heliogrid/contracts';
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
  Button,
  type CatalogEditorOwnActs,
  CatalogPriceEditor,
  CatalogRelease,
  catalogEditorSwitches,
  EditorSurface,
  Modal,
  Text,
  useCatalogFormats,
} from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { ReleasesSurface } from './ReleasesSurface';

type Release = CatalogFacts['release'];

/** *Cancel* and the act side by side, the act the wider; a consequence line above when given. */
export function Foot({
  line = null,
  cancel,
  onCancel,
  children,
}: {
  line?: TranslatedText | null;
  cancel: { label: TranslatedText; variant?: 'secondary' | 'ghost' };
  onCancel: () => void;
  children: ReactNode;
}) {
  const acts = (
    <div className="hg-catalog-foot">
      <Button variant={cancel.variant ?? 'secondary'} size="lg" fullWidth onClick={onCancel}>
        {cancel.label}
      </Button>
      {children}
    </div>
  );
  if (line === null) return acts;
  return (
    <div className="hg-catalog-foot-stack">
      <Text variant="caption" color="secondary">
        {line}
      </Text>
      {acts}
    </div>
  );
}

/**
 * The Items panel's overlays on the web (`SCR-M01-15`): the price editor beside the list — a side
 * panel that leaves the row reachable at 1536, a sheet below —, the archive warning, the publish
 * dialog and the releases. The bodies are the shared ones; this holds them and draws their feet.
 */
export function ItemsOverlays({
  overlays,
  schemes,
  release,
  onPriceSaved,
  ownActs,
  docked,
}: {
  overlays: CatalogOverlays;
  schemes: readonly string[];
  release: Release;
  /** A price landed: the panel's toast plays the `saved` moment under the item's name. */
  onPriceSaved: (name: string) => void;
  /** An own SKU's *Prefer* and *Archive* in its editor, done at once as its row did them. */
  ownActs: CatalogEditorOwnActs | null;
  /** The desktop draws the editor docked beside the list (`PriceEditorDock`), never over it. */
  docked: boolean;
}) {
  return (
    <>
      {docked ? null : (
        <PriceEditorSurface
          overlays={overlays}
          schemes={schemes}
          onPriceSaved={onPriceSaved}
          ownActs={ownActs}
        />
      )}
      <ArchiveConfirm overlays={overlays} />
      <PublishSurface overlays={overlays} release={release} />
      <ReleasesSurface releases={overlays.releases} />
    </>
  );
}

function PriceEditorSurface({
  overlays,
  schemes,
  onPriceSaved,
  ownActs,
}: {
  overlays: CatalogOverlays;
  schemes: readonly string[];
  onPriceSaved: (name: string) => void;
  ownActs: CatalogEditorOwnActs | null;
}) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const { draft } = overlays;
  const item = draft.item;
  const platform = item?.source === 'platform_item';
  return (
    <EditorSurface
      open={item !== null}
      onClose={draft.close}
      closeLabel={t(CATALOG_EDITOR.close)}
      showClose
      modal={false}
      /* The act alone, full width (direction A): the sheet's close is the way out. */
      footer={
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={draft.pending}
          onClick={() => {
            const name = item === null ? '' : `${item.brand} ${item.model}`;
            void draft.save().then((saved) => {
              if (saved) onPriceSaved(name);
            });
          }}
        >
          {t(CATALOG_EDITOR.savePrice)}
        </Button>
      }
    >
      {item === null ? null : (
        <CatalogPriceEditor
          words={catalogPriceEditorWords(
            t,
            platform && draft.taxPct !== '' ? formats.percent(draft.taxPct) : null,
          )}
          item={catalogEditedItemOf(t, item, schemes, formats)}
          amount={draft.amount}
          onAmount={draft.setAmount}
          taxPct={platform ? draft.taxPct : null}
          onTaxPct={draft.setTaxPct}
          taxOverridden={draft.taxPct !== ''}
          packRateMissing={item.tax?.source !== 'pack'}
          switches={platform ? catalogEditorSwitches(draft) : null}
          ownActs={ownActs}
          problem={draft.problem === null ? null : t(CATALOG_EDITOR.saveFailed)}
        />
      )}
    </EditorSurface>
  );
}

function ArchiveConfirm({ overlays }: { overlays: CatalogOverlays }) {
  const { t } = useI18n();
  const asked = overlays.archiving;
  const name = asked === null ? '' : `${asked.item.brand} ${asked.item.model}`;
  return (
    <Modal
      open={asked !== null}
      onClose={overlays.keep}
      closeLabel={t(CATALOG_EDITOR.close)}
      size="md"
      tone="warning"
      showClose={false}
      title={asked === null ? undefined : t(CATALOG_EDITOR.archiveTitle, { name })}
      description={
        asked === null ? undefined : t(CATALOG_EDITOR.archiveDrafts, { count: asked.drafts })
      }
      footer={
        <Foot
          cancel={{ label: t(CATALOG_EDITOR.keepIt), variant: 'ghost' }}
          onCancel={overlays.keep}
        >
          <Button variant="destructive" size="lg" fullWidth onClick={overlays.confirmArchive}>
            {t(CATALOG_EDITOR.archiveIt)}
          </Button>
        </Foot>
      }
    />
  );
}

function PublishSurface({ overlays, release }: { overlays: CatalogOverlays; release: Release }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const preview = useReleasePreview(overlays.publishing);
  const shown = catalogPublishView(
    t,
    {
      counts: preview.counts,
      lines: preview.lines.read.kind === 'ready' ? preview.lines.read.value : [],
    },
    overlays.publish.refusal,
    formats,
  );
  const { publish } = overlays;
  return (
    <EditorSurface
      open={overlays.publishing}
      onClose={overlays.closePublish}
      closeLabel={t(CATALOG_EDITOR.close)}
      desktop="modal"
      size="auto"
      title={t(CATALOG_EDITOR.publishTitle)}
      subtitle={
        release === null
          ? t(CATALOG_EDITOR.publishFirst)
          : t(CATALOG_EDITOR.publishReplaces, { label: release.label })
      }
      footer={
        <Foot
          line={
            release === null || !shown.sendable
              ? null
              : t(CATALOG_EDITOR.staleCountAbsent, { label: release.label })
          }
          cancel={{ label: t(CATALOG_EDITOR.cancel) }}
          onCancel={overlays.closePublish}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={publish.pending}
            disabled={overlays.label.trim() === '' || !shown.sendable}
            onClick={() => void overlays.sendPublish()}
          >
            {t(CATALOG_SETTINGS.publish)}
          </Button>
        </Foot>
      }
    >
      <CatalogRelease
        mode="publish"
        words={catalogReleaseWords(t)}
        label={overlays.label}
        onLabel={overlays.setLabel}
        problem={shown.problem}
        empty={shown.empty}
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
