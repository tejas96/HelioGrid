'use client';
import type { LeadFile } from '@heliogrid/contracts';
import { can, type Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import type { FilePickTarget, PickedFile } from './picked-file';
import { readOf } from './read';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

/**
 * The lead's Files section (`M02-32`): the customer's papers, oldest first, and a picked file
 * stored against the lead then put on it — one at a time, the one that came back undone kept to
 * send again.
 */
export interface LeadFiles extends FilePickTarget {
  /** Empty until a file is added; read once the section is in view. */
  readonly read: Read<readonly LeadFile[]>;
  /** The reader may add a file — the add-and-edit grant (`crm.add_edit_leads`). */
  readonly canAdd: boolean;
  /** The pick is going up; every other add waits for its answer. */
  readonly uploading: boolean;
  /** The last pick's own name — what the going-up and the not-added lines say. */
  readonly picked: string | null;
  /** A file's short-lived link, to open it. */
  fileLink(fileId: string): Promise<string>;
}

const now = () => new Date().toISOString();

/** Fills `LeadFiles` for one lead; `shown` is whether its section is in view. */
export function useLeadFiles(leadId: string, shown: boolean): LeadFiles {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const canAdd = can(useSession().user?.tenant?.roles ?? [], 'crm.add_edit_leads');
  const key = queryKeys.crm.leadFiles(tenantId, leadId);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const lastPick = useRef<PickedFile | null>(null);
  const out = useRef(false);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.leadFiles.list(leadId, signal).then((one) => one.items),
    enabled: tenantId !== '' && shown,
  });

  /** Stores the pick against the lead, then puts it on the lead under its own name. */
  const store = (file: PickedFile) => {
    if (out.current) return;
    out.current = true;
    lastPick.current = file;
    setPicked(file.name);
    setUploading(true);
    setUploadFailed(false);
    void (async () => {
      try {
        const stored = await repositories.file.store({
          subjectKind: 'lead',
          subjectRef: leadId,
          contentType: file.contentType,
          bytes: file.bytes,
        });
        const listed = await repositories.leadFiles.attach(leadId, {
          fileId: stored.id,
          name: file.name,
          capturedAt: now(),
        });
        queryClient.setQueryData(key, listed.items);
        // The lead's own read counts its files for the Files tab: it reads again too.
        await queryClient.invalidateQueries({
          queryKey: queryKeys.crm.lead(tenantId, leadId),
          exact: true,
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(tenantId) });
      } catch {
        setUploadFailed(true);
      } finally {
        out.current = false;
        setUploading(false);
      }
    })();
  };

  return {
    read: readOf(query, (files) => files.length === 0),
    canAdd,
    upload: store,
    uploading,
    uploadFailed,
    picked,
    retryUpload: () => {
      if (lastPick.current !== null) store(lastPick.current);
    },
    fileLink: (fileId) => repositories.file.downloadUrl(fileId).then((link) => link.url),
  };
}
