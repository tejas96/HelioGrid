'use client';
import type { LeadFiles } from '@heliogrid/data/react';
import { useRouter } from 'next/navigation';
import { openExternal } from '../../../lib/open-external';
import { pickLeadFile } from '../../../lib/pick-file';
import { projectPath } from '../../shell';
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
    openFile: (fileId) => {
      void files.fileLink(fileId).then(
        (url) => openExternal(url),
        () => undefined,
      );
    },
  };
}
