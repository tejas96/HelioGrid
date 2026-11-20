'use client';
import { useRouter } from 'next/navigation';
import { DOOR_PATH, designPath, designSitePath, leadPath } from '../shell';

/** The web's own moves off a studio page: the router. */
export function useStudioMoves() {
  const router = useRouter();
  return {
    toLeads: () => router.push(DOOR_PATH.leads),
    toProposals: () => router.push(DOOR_PATH.proposals),
    toLead: (leadId: string) => router.push(leadPath(leadId)),
    /** The design's own page, in place of the Site details that started it: Back skips the form. */
    toDesign: (designId: string, fromProposals = false) =>
      router.replace(designPath(designId, fromProposals)),
    toSiteDetails: (designId: string, fromProposals = false) =>
      router.push(designSitePath(designId, fromProposals)),
    /** Site details in place of the studio: its save or Cancel opens the studio again in its place. */
    swapToSiteDetails: (designId: string, fromProposals = false) =>
      router.replace(designSitePath(designId, fromProposals)),
  };
}

export type StudioMoves = ReturnType<typeof useStudioMoves>;
