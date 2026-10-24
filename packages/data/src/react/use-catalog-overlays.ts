'use client';
import type { ResolvedCatalogItemWire } from '@heliogrid/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { CatalogActs } from './use-catalog-acts';
import { useCatalogPriceDraft } from './use-catalog-price-draft';
import { usePublishRelease } from './use-catalog-releases';
import { useSession } from './use-session';

type Item = ResolvedCatalogItemWire;

/**
 * The Items panel's overlays and what opens them (`SCR-M01-15`): the price editor's draft, the
 * archive warning — asked only when drafts still name the item (`§M01.4`) —, the publish dialog's
 * name and the releases view. Both apps hold the same overlays; each draws them its own way.
 */
export function useCatalogOverlays(acts: CatalogActs) {
  const queryClient = useQueryClient();
  const tenantId = useSession().user?.tenant?.id ?? '';
  const draft = useCatalogPriceDraft(acts);
  const publish = usePublishRelease();
  const [archiving, setArchiving] = useState<{ item: Item; drafts: number } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [label, setLabel] = useState('');
  const [releasesOpen, setReleasesOpen] = useState(false);
  return {
    acts,
    draft,
    publish,
    archiving,
    publishing,
    label,
    releasesOpen,
    openEditor: draft.open,
    /** Archive asks first only when drafts still name the item (`§M01.4`); else it goes at once. */
    async askArchive(item: Item) {
      const drafts = await acts.draftsNaming(item).catch(() => 0);
      if (drafts > 0) setArchiving({ item, drafts });
      else acts.archive(item);
    },
    confirmArchive() {
      if (archiving !== null) acts.archive(archiving.item);
      setArchiving(null);
    },
    keep: () => setArchiving(null),
    openPublish() {
      /* Nothing held from an earlier open is shown: the preview is read afresh. */
      queryClient.removeQueries({ queryKey: queryKeys.catalog.preview(tenantId) });
      setLabel('');
      publish.clear();
      setPublishing(true);
    },
    closePublish: () => setPublishing(false),
    setLabel(next: string) {
      setLabel(next);
      publish.clear();
    },
    openReleases: () => setReleasesOpen(true),
    closeReleases: () => setReleasesOpen(false),
    /** Publishes under the typed name; the dialog closes once the release is in force. */
    async sendPublish() {
      if (await publish.publish(label.trim())) setPublishing(false);
    },
  };
}

export type CatalogOverlays = ReturnType<typeof useCatalogOverlays>;
