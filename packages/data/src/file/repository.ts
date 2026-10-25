import type {
  DeclareFile,
  FileDownload,
  FileErrorCode,
  FileUpload,
  StoredFile,
} from '@heliogrid/contracts';
import { checksumSha256Of, FILE_UPLOAD_LINK_SECONDS } from '@heliogrid/domain';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import {
  DataError,
  NetworkError,
  normalizeClientError,
  RequestTimeoutError,
  toApiError,
} from '../errors/errors';

/** The store's answers that mean a file's bytes are not the type the device named. */
export const REFUSED_AS_ANOTHER_TYPE: readonly string[] = [
  'FILE_CONTENT_MISMATCH',
  'FILE_TYPE_NOT_TAKEN',
] satisfies readonly FileErrorCode[];

/** A file as a device holds it before it is stored. */
export interface FileToStore
  extends Pick<DeclareFile, 'subjectKind' | 'subjectRef' | 'contentType'> {
  readonly bytes: Uint8Array;
}

/** A company's stored files (`T-FPLAT-035`): the api holds the row, the store holds the bytes. */
export interface FileRepository {
  /**
   * Declares the file, sends its bytes straight to the store and confirms them. The same file sent
   * again after a failure carries the same key, so it resumes the row the first send made.
   */
  store(file: FileToStore): Promise<StoredFile>;
  /** A short-lived link to a confirmed file. */
  downloadUrl(id: string, signal?: AbortSignal): Promise<FileDownload>;
}

export function createFileRepository(api: ApiClient): FileRepository {
  const creationKeys = createCreationKeys();
  return {
    async store({ bytes, ...subject }) {
      try {
        const body = {
          ...subject,
          byteSize: bytes.byteLength,
          checksumSha256: checksumSha256Of(bytes),
        };
        const declared = await api.file.declare({ body, headers: creationKeys.headersFor(body) });
        if (declared.status !== 201) throw toApiError(declared);
        const { file, upload } = declared.body;
        if (upload !== null) await sendToStore(upload, bytes);
        const confirmed = await api.file.complete({ params: { id: file.id } });
        if (confirmed.status !== 200) throw toApiError(confirmed);
        creationKeys.settle();
        return confirmed.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async downloadUrl(id, signal) {
      try {
        const res = await api.file.downloadUrl({ params: { id }, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}

/**
 * The store is not the api: it takes no session and answers no envelope, and it refuses any header
 * the link was not signed with. A refusal reads as no answer, so the save can be sent again. The
 * send is given the link's own life — one slow mobile upload — and no longer: past it the store
 * refuses the bytes, and a save must never wait with no end.
 */
async function sendToStore(upload: FileUpload, bytes: Uint8Array): Promise<void> {
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), FILE_UPLOAD_LINK_SECONDS * 1000);
  let answer: Response;
  try {
    const { url, method, headers } = upload;
    answer = await fetch(url, { method, headers, body: bytes, signal: deadline.signal });
  } catch {
    throw deadline.signal.aborted ? new RequestTimeoutError() : new NetworkError();
  } finally {
    clearTimeout(timer);
  }
  if (!answer.ok) throw new DataError('The store did not take the upload.', true, 'no_answer');
}
