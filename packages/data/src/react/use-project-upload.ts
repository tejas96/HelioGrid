import type { ProjectDetail } from '@heliogrid/contracts';
import { FILE_SUBJECT_RULES, judgeFileDeclaration } from '@heliogrid/domain';
import { useRef, useState } from 'react';
import type { ProjectToast } from '../projects/project-act-send';
import { useRepositories } from './context';
import type { PickedFile, PickRefusal } from './picked-file';
import type { FilePlace } from './project-hero-act';

/**
 * A picked file on a project (`useProjectScreen`'s): stored, then put in its place — a row's
 * document makes the row done — with the place uploading, the one whose upload came back undone,
 * and that same file sent again on *Retry*.
 */
export function useProjectUpload(
  projectId: string,
  landed: (detail: ProjectDetail) => Promise<void>,
  done: (said: ProjectToast) => void,
) {
  const repositories = useRepositories();
  const [uploading, setUploading] = useState<FilePlace | null>(null);
  const [uploadFailed, setUploadFailed] = useState<FilePlace | null>(null);
  const last = useRef<{ file: PickedFile; place: FilePlace } | null>(null);
  const store = (file: PickedFile, place: FilePlace) => {
    // The store would refuse it, and a retry never helps: said at once, nothing sent.
    const why = refusalOf(file);
    if (why !== null) return done({ kind: 'fileRefused', why, name: file.name });
    last.current = { file, place };
    setUploading(place);
    setUploadFailed(null);
    void (async () => {
      try {
        const stored = await repositories.file.store({
          subjectKind: 'project',
          subjectRef: projectId,
          contentType: file.contentType,
          bytes: file.bytes,
        });
        const detail = await repositories.projects.acts.attachFile(projectId, {
          fileId: stored.id,
          slot: place.slot,
          slotKey: place.slotKey,
          name: file.name,
          capturedAt: new Date().toISOString(),
        });
        await landed(detail);
        done(
          place.slot === 'document' && place.slotKey !== null
            ? { kind: 'documentDone', row: place.slotKey }
            : { kind: 'saved' },
        );
      } catch {
        setUploadFailed(place);
      } finally {
        setUploading(null);
      }
    })();
  };
  return {
    store,
    refusalOf,
    retry: () => {
      if (last.current !== null) store(last.current.file, last.current.place);
    },
    uploading,
    uploadFailed,
  };
}

/** Why a project would refuse this file — too large, or not its type — or `null` when it takes it. */
export function refusalOf(file: PickedFile): PickRefusal | null {
  const verdict = judgeFileDeclaration(
    FILE_SUBJECT_RULES.project,
    file.contentType,
    file.bytes.byteLength,
  );
  return verdict === 'accepted' ? null : verdict;
}
