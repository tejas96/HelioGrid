import { Writable } from 'node:stream';
import type { ObjectStore } from '@heliogrid/contracts';
import {
  can,
  FILE_SUBJECT_RULES,
  FOUNDER_ROLE,
  ROLE_PRESETS,
  type RolePreset,
} from '@heliogrid/domain';
import { PinoLogger } from 'nestjs-pino';
import { CreationReplies } from '../../src/common/creation-key';
import { FileRepository } from '../../src/modules/file/file.repository';
import { FileService } from '../../src/modules/file/file.service';
import { MemoryObjectStore, sha256Of } from '../../src/modules/file/internal/object-store.memory';
import type { openPools } from '../support/fixture';

type Pools = ReturnType<typeof openPools>;

/**
 * Who may store the logo and who may not, read from the capability matrix rather than named — so
 * a change to the matrix moves these with it instead of leaving a test proving the old rule.
 */
export const UPLOADER: readonly RolePreset[] = [FOUNDER_ROLE];
const withoutUpload = ROLE_PRESETS.find((role) => !can([role], FILE_SUBJECT_RULES.tenant.upload));
if (withoutUpload === undefined) throw new Error('every preset may upload the logo');
export const NON_UPLOADER: readonly RolePreset[] = [withoutUpload];

/** The eight bytes every PNG starts with, as the format writes them in hex. */
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
/** Any byte past the signature; the tests care only that the image starts right. */
const FILLER = 7;

/** A PNG as far as its signature goes, padded to the size a test asks for. */
export function pngOf(byteSize: number): Uint8Array {
  const bytes = new Uint8Array(byteSize);
  bytes.set(PNG_SIGNATURE);
  bytes.fill(FILLER, PNG_SIGNATURE.length);
  return bytes;
}

/** The same bytes with one changed past the signature: equal length, another checksum. */
export function alteredCopyOf(bytes: Uint8Array): Uint8Array {
  const altered = bytes.slice();
  const last = altered.length - 1;
  altered[last] = (altered[last] ?? 0) ^ 1;
  return altered;
}

/** A page, which must never be kept as a logo whatever it is declared as. */
export function htmlOf(): Uint8Array {
  return new TextEncoder().encode('<html><script>alert(1)</script></html>');
}

/** What a client declares for these bytes. */
export function declarationOf(tenantId: string, bytes: Uint8Array) {
  return {
    subjectKind: 'tenant' as const,
    subjectRef: tenantId,
    contentType: 'image/png' as const,
    byteSize: bytes.length,
    checksumSha256: sha256Of(bytes),
  };
}

/**
 * The service as `file.module.ts` composes it, over the real repository and a memory store the
 * test drives — and a logger whose every line is kept, so a proof can read what reached the log.
 */
export function fileServiceOf(
  pools: Pools,
  wrap: (store: MemoryObjectStore) => ObjectStore = (store) => store,
) {
  const store = new MemoryObjectStore();
  const logged: string[] = [];
  const sink = new Writable({
    write(chunk, _encoding, done) {
      logged.push(String(chunk));
      done();
    },
  });
  const logger = new PinoLogger({ pinoHttp: [{ level: 'trace' }, sink] });
  const service = new FileService(
    new FileRepository(pools.tenants),
    wrap(store),
    new CreationReplies(logger),
    logger,
  );
  return { service, store, logged };
}
