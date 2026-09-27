import { createHash } from 'node:crypto';
import type {
  DownloadLinkRequest,
  ObjectStore,
  SignedUpload,
  StoredObject,
  UploadLinkRequest,
} from '@heliogrid/contracts';

interface Expected {
  readonly byteSize: number;
  readonly checksumSha256: string;
}

const LINK_PREFIX = 'memory://files/';

/**
 * A store held in this process, bound under test and in a development machine with no store
 * configured. It keeps the one promise a real store makes — bytes other than the signed length
 * and checksum are refused — so the api's own proofs exercise the same refusals the wire meets.
 * `receive` stands in for the client's PUT, and `outage` for a store that stopped answering.
 * It never runs in production: the module refuses to boot with it there.
 */
export class MemoryObjectStore implements ObjectStore {
  readonly provider = 'local' as const;
  private readonly expected = new Map<string, Expected>();
  private readonly objects = new Map<string, Uint8Array>();
  private down = false;

  async signUpload(request: UploadLinkRequest): Promise<SignedUpload> {
    this.expected.set(request.key, {
      byteSize: request.byteSize,
      checksumSha256: request.checksumSha256,
    });
    return {
      url: `${LINK_PREFIX}${request.key}`,
      headers: { 'x-amz-checksum-sha256': request.checksumSha256 },
    };
  }

  async signDownload(request: DownloadLinkRequest): Promise<string> {
    return `${LINK_PREFIX}${request.key}?type=${encodeURIComponent(request.contentType)}`;
  }

  async head(key: string): Promise<StoredObject | null> {
    this.answer();
    const bytes = this.objects.get(key);
    if (bytes === undefined) return null;
    return { checksumSha256: sha256Of(bytes) };
  }

  async readFirstBytes(key: string, count: number): Promise<Uint8Array> {
    this.answer();
    return (this.objects.get(key) ?? new Uint8Array()).slice(0, count);
  }

  /** The client's PUT through a signed link. False where a real store would refuse the bytes. */
  receive(url: string, bytes: Uint8Array): boolean {
    const key = url.slice(LINK_PREFIX.length);
    const expected = this.expected.get(key);
    if (expected === undefined) return false;
    if (bytes.length !== expected.byteSize || sha256Of(bytes) !== expected.checksumSha256) {
      return false;
    }
    this.objects.set(key, bytes);
    return true;
  }

  /** Stored as-is, bypassing the link: what a store that enforced nothing would have kept. */
  keepUnchecked(key: string, bytes: Uint8Array): void {
    this.objects.set(key, bytes);
  }

  outage(down: boolean): void {
    this.down = down;
  }

  private answer(): void {
    if (this.down) throw new Error('the memory store is in an outage');
  }
}

export function sha256Of(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('base64');
}
