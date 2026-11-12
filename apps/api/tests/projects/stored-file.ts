import { type DeclaredFile, type FileContentType, OBJECT_STORE } from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import {
  type MemoryObjectStore,
  sha256Of,
} from '../../src/modules/file/internal/object-store.memory';
import { retryKey } from '../crm/support';
import type { Caller, ProjectsWorld } from './support';

/** What a person's own upload stores: the record it hangs on and the bytes. */
export interface Upload {
  readonly subjectKind: 'project' | 'project_payment';
  readonly subjectRef: string;
  readonly contentType: FileContentType;
  readonly bytes: Uint8Array;
}

/**
 * Declare, put the bytes, complete — as a person's upload does. The declare's status when it is
 * refused, else the stored file's id.
 */
export async function anUpload(
  world: ProjectsWorld,
  caller: Caller,
  upload: Upload,
): Promise<{ readonly status: number; readonly fileId: string | null }> {
  const { bytes, ...declared } = upload;
  const reply = await caller.call<DeclaredFile>(
    'POST',
    '/files',
    { ...declared, byteSize: bytes.length, checksumSha256: sha256Of(bytes) },
    retryKey(),
  );
  if (reply.status !== HttpStatus.CREATED) return { status: reply.status, fileId: null };
  const store = world.http.app.get<MemoryObjectStore>(OBJECT_STORE);
  if (!store.receive(reply.body.upload?.url ?? '', bytes)) throw new Error('upload refused');
  const done = await caller.call('POST', `/files/${reply.body.file.id}/complete`);
  if (done.status !== HttpStatus.OK) throw new Error(`complete: got ${done.status}`);
  return { status: reply.status, fileId: reply.body.file.id };
}

/** These bytes stored through the person's upload; throws when the declare is refused. */
export async function aStored(
  world: ProjectsWorld,
  caller: Caller,
  upload: Upload,
): Promise<string> {
  const stored = await anUpload(world, caller, upload);
  if (stored.fileId === null) throw new Error(`declare: got ${stored.status}`);
  return stored.fileId;
}
