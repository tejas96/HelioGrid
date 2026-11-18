'use client';
import type {
  LeadDesignsMoves,
  LeadDetailScreen,
  LeadFiles,
  LeadProposalsMoves,
} from '@heliogrid/data/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { openExternal } from '../../../lib/open-external';
import { pickLeadFile } from '../../../lib/pick-file';
import {
  designPath,
  designSitePath,
  leadPath,
  projectPath,
  proposalBuilderPath,
  proposalPath,
} from '../../shell';
import { LEADS_PATH, mergePath, referralPath } from '../constants';

/** The web's own moves off Lead Detail: the router, the dialler, the clipboard and the file chooser. */
export interface LeadDetailMoves {
  toLeads(): void;
  /** Quick add with this customer as the referrer (`M02-16`). */
  addReferral(leadId: string): void;
  /** Customer merge with this customer as the survivor, and the other record when known (`M02-63`). */
  merge(survivorId: string, loserId?: string): void;
  /** Hands the number to the device's dialler — a `tel:` link opened. */
  dial(phoneE164: string): void;
  /** Copies the text, then says so: the person pastes it in their own app (`M02-33`). */
  copy(text: string, copied: () => void): void;
  /** The project *Mark won* started (`M07-62`). */
  openProject(projectId: string | null): void;
  /** The browser's own chooser for a file to add — or the pick that came back undone, sent again. */
  addFile(): void;
  /** A file of the lead, opened in a new tab. */
  openFile(fileId: string): void;
  /** Where the lead's proposals lead: the builder, a proposal's own page, a sibling lead. */
  readonly proposals: LeadProposalsMoves;
  /** Where the lead's designs lead: the Site details of a new one, a design's own page. */
  readonly designs: LeadDesignsMoves;
}

export function useLeadDetailMoves(files: LeadFiles): LeadDetailMoves {
  const router = useRouter();
  return {
    toLeads: () => router.push(LEADS_PATH),
    addReferral: (leadId) => router.push(referralPath(leadId)),
    merge: (survivorId, loserId) => router.push(mergePath(survivorId, loserId)),
    dial: (phoneE164) => window.location.assign(`tel:${phoneE164}`),
    copy: (text, copied) => {
      void navigator.clipboard.writeText(text).then(copied, () => undefined);
    },
    openProject: (projectId) => {
      if (projectId !== null) router.push(projectPath(projectId));
    },
    addFile: () => pickLeadFile(files),
    proposals: {
      toBuilder: (proposalId) => router.push(proposalBuilderPath(proposalId)),
      toProposal: (proposalId) => router.push(proposalPath(proposalId)),
      toLead: (leadId) => router.push(leadPath(leadId)),
      toSiteDetails: (designId) => router.push(designSitePath(designId)),
    },
    designs: {
      toSiteDetails: (designId) => router.push(designSitePath(designId)),
      toDesign: (designId) => router.push(designPath(designId)),
    },
    openFile: (fileId) => {
      void files.fileLink(fileId).then(
        (url) => openExternal(url),
        () => undefined,
      );
    },
  };
}

/**
 * `?won=1` opens *Mark won* once the lead is read and the reader may close it — and only once. The
 * mark leaves the address once the lead is read either way: a lead the reader may not close never
 * keeps a mark that a reload would act on later.
 */
export function useWonOnArrival(won: boolean, screen: LeadDetailScreen): void {
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);
  const read = screen.read.kind === 'ready';
  const mayWin = read && screen.canWin && screen.read.value.view.acts.markWon;
  const open = useRef(screen.won.open);
  open.current = screen.won.open;
  useEffect(() => {
    if (!won || !read || handled.current) return;
    handled.current = true;
    if (mayWin) open.current();
    // The link has done its job: a reload shows the page, not the sheet again.
    router.replace(pathname, { scroll: false });
  }, [won, read, mayWin, router, pathname]);
}
