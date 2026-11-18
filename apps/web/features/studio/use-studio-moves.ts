'use client';
import { useRouter } from 'next/navigation';
import { DOOR_PATH, designPath, designSitePath, leadPath } from '../shell';

/** The web's own moves off a studio page: the router. */
export function useStudioMoves() {
  const router = useRouter();
  return {
    toLeads: () => router.push(DOOR_PATH.leads),
    toLead: (leadId: string) => router.push(leadPath(leadId)),
    /** The design's own page, in place of the Site details that started it: Back skips the form. */
    toDesign: (designId: string) => router.replace(designPath(designId)),
    toSiteDetails: (designId: string) => router.push(designSitePath(designId)),
  };
}

export type StudioMoves = ReturnType<typeof useStudioMoves>;
