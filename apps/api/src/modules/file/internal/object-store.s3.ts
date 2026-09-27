import {
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  DownloadLinkRequest,
  ObjectStore,
  SignedUpload,
  StoredObject,
  UploadLinkRequest,
} from '@heliogrid/contracts';
import type { StorageProvider } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';

export interface S3StoreSettings {
  readonly provider: StorageProvider;
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly forcePathStyle: boolean;
  /** How long one call may take before it counts as an outage, and how often it is tried. */
  readonly timeouts: { readonly connectMs: number; readonly requestMs: number };
  readonly maxAttempts: number;
}

/**
 * The checksum headers stay HEADERS. The signer otherwise moves every `x-amz-*` header into the
 * query string, where it is signed but no longer an instruction the store verifies the body
 * against — and an upload of other bytes would be kept.
 */
const CHECKSUM_HEADERS = new Set(['x-amz-checksum-sha256', 'x-amz-sdk-checksum-algorithm']);

/**
 * The one adapter behind `ObjectStore`: the S3 API, which Oracle Object Storage, RustFS, Tigris, R2
 * and AWS all speak. A vendor is its settings.
 *
 * `requestChecksumCalculation: 'WHEN_REQUIRED'` because the SDK's default adds a CRC32 of its own
 * to every signed upload — a checksum of bytes it never sees, which the client could not match —
 * and not every S3-compatible store knows it.
 */
export class S3ObjectStore implements ObjectStore {
  readonly provider: StorageProvider;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(settings: S3StoreSettings) {
    this.provider = settings.provider;
    this.bucket = settings.bucket;
    this.client = new S3Client({
      endpoint: settings.endpoint,
      region: settings.region,
      forcePathStyle: settings.forcePathStyle,
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      maxAttempts: settings.maxAttempts,
      requestHandler: {
        connectionTimeout: settings.timeouts.connectMs,
        requestTimeout: settings.timeouts.requestMs,
        // Without it a request past its timeout only WARNS and keeps waiting on a silent store.
        throwOnRequestTimeout: true,
      },
    });
  }

  async signUpload(request: UploadLinkRequest): Promise<SignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: request.key,
      ContentLength: request.byteSize,
      ChecksumAlgorithm: 'SHA256',
      ChecksumSHA256: request.checksumSha256,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: request.expiresInSeconds,
      unhoistableHeaders: CHECKSUM_HEADERS,
    });
    return {
      url,
      headers: {
        'x-amz-checksum-sha256': request.checksumSha256,
        'x-amz-sdk-checksum-algorithm': 'SHA256',
      },
    };
  }

  signDownload(request: DownloadLinkRequest): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: request.key,
      ResponseContentType: request.contentType,
      ResponseContentDisposition: 'attachment',
    });
    return getSignedUrl(this.client, command, { expiresIn: request.expiresInSeconds });
  }

  async head(key: string): Promise<StoredObject | null> {
    try {
      const stored = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key, ChecksumMode: 'ENABLED' }),
      );
      return { checksumSha256: stored.ChecksumSHA256 ?? null };
    } catch (error) {
      if (isAbsent(error)) return null;
      throw error;
    }
  }

  async readFirstBytes(key: string, count: number): Promise<Uint8Array> {
    const stored = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: `bytes=0-${count - 1}` }),
    );
    if (stored.Body === undefined) return new Uint8Array();
    return stored.Body.transformToByteArray();
  }
}

/** HEAD carries no body, so a missing object is told by its status, never by a message. */
function isAbsent(error: unknown): boolean {
  if (error instanceof NotFound) return true;
  return (
    error instanceof S3ServiceException && error.$metadata.httpStatusCode === HttpStatus.NOT_FOUND
  );
}
