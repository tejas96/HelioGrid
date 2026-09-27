import type { FileContentType, StorageProvider } from '@heliogrid/domain';

/**
 * The port every stored byte leaves and returns through (`T-FPLAT-035`). The api never holds a
 * file: it signs a link, the client moves the bytes straight to the store, and the api only asks
 * the store what arrived. One adapter speaks the S3 API, which every store the suite has used or
 * will use speaks — so a vendor change is store settings, never a second implementation.
 *
 * A store behind this port MUST refuse an upload whose length or SHA-256 differs from the signed
 * link, and MUST report the stored SHA-256 on `head`. A store that cannot is not a store this
 * suite can use: `complete` fails closed without the checksum.
 */
export interface UploadLinkRequest {
  /** The object key, built from server ids only — never from anything a client sent. */
  readonly key: string;
  readonly byteSize: number;
  /** Base64 SHA-256 of the exact bytes the client will send. */
  readonly checksumSha256: string;
  readonly expiresInSeconds: number;
}

export interface SignedUpload {
  readonly url: string;
  /**
   * The headers to send beside the bytes. The signature covers these and `Content-Length`, which
   * the client's HTTP stack sets from the bytes themselves; send anything else and the store
   * refuses.
   */
  readonly headers: Readonly<Record<string, string>>;
}

export interface DownloadLinkRequest {
  readonly key: string;
  /** Forced onto the response whatever type the bytes were uploaded with. */
  readonly contentType: FileContentType;
  readonly expiresInSeconds: number;
}

export interface StoredObject {
  /** Null when the store kept none — which `complete` treats as a mismatch, never as a pass. */
  readonly checksumSha256: string | null;
}

export interface ObjectStore {
  /** Which store this is — what a file row records, so its bytes can always be found again. */
  readonly provider: StorageProvider;
  signUpload(request: UploadLinkRequest): Promise<SignedUpload>;
  /** Always served as an attachment, so no stored bytes ever render as a page. */
  signDownload(request: DownloadLinkRequest): Promise<string>;
  /** Null when nothing is stored under the key. Throws on an outage — anything but "absent". */
  head(key: string): Promise<StoredObject | null>;
  /** The first `count` bytes, or fewer when the object is shorter. */
  readFirstBytes(key: string, count: number): Promise<Uint8Array>;
}

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const OBJECT_STORE = Symbol.for('heliogrid.ObjectStore');
