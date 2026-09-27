import type { ObjectStore } from '@heliogrid/contracts';
import {
  FILE_STORE_ATTEMPTS,
  FILE_STORE_CONNECT_MS,
  FILE_STORE_REQUEST_MS,
  STORAGE_PROVIDERS,
  type StorageProvider,
} from '@heliogrid/domain';
import type { ApiEnv } from '../../../config/env';
import { MemoryObjectStore } from './object-store.memory';
import { S3ObjectStore } from './object-store.s3';

type StoreEnv = Pick<
  ApiEnv,
  | 'NODE_ENV'
  | 'OBJECT_STORE_PROVIDER'
  | 'OBJECT_STORE_ENDPOINT'
  | 'OBJECT_STORE_REGION'
  | 'OBJECT_STORE_BUCKET'
  | 'OBJECT_STORE_ACCESS_KEY_ID'
  | 'OBJECT_STORE_SECRET_ACCESS_KEY'
  | 'OBJECT_STORE_FORCE_PATH_STYLE'
>;

/**
 * The store a boot binds, decided from its settings alone. Under TEST it is always the memory
 * store, settings or not: a developer's `.env.local` points at a real bucket, and a suite that
 * picked it up would write into it on every run. In development with no store configured it is
 * the memory store too, said in the log, so the api still boots on a machine without one.
 *
 * Production takes the opposite fallback: a store that forgets every file on restart is worse
 * than none, so a missing store, an unknown provider and the development `local` one all stop the
 * boot with the reason.
 */
export function objectStoreFor(env: StoreEnv, warn: (message: string) => void): ObjectStore {
  if (env.NODE_ENV === 'test') return new MemoryObjectStore();
  const provider = env.OBJECT_STORE_PROVIDER;
  if (provider === undefined) {
    if (env.NODE_ENV === 'production') {
      throw new Error('No object store configured. Set every OBJECT_STORE_ variable.');
    }
    warn('No object store configured: files are held in memory and no client can upload them.');
    return new MemoryObjectStore();
  }
  if (!isStorageProvider(provider)) {
    throw new Error(
      `OBJECT_STORE_PROVIDER "${provider}" is not one of: ${STORAGE_PROVIDERS.join(', ')}.`,
    );
  }
  if (provider === 'local' && env.NODE_ENV === 'production') {
    throw new Error(
      'The local object store is a development container and never runs in production.',
    );
  }
  return new S3ObjectStore({
    provider,
    endpoint: required(env.OBJECT_STORE_ENDPOINT),
    region: required(env.OBJECT_STORE_REGION),
    bucket: required(env.OBJECT_STORE_BUCKET),
    accessKeyId: required(env.OBJECT_STORE_ACCESS_KEY_ID),
    secretAccessKey: required(env.OBJECT_STORE_SECRET_ACCESS_KEY),
    forcePathStyle: env.OBJECT_STORE_FORCE_PATH_STYLE,
    timeouts: { connectMs: FILE_STORE_CONNECT_MS, requestMs: FILE_STORE_REQUEST_MS },
    maxAttempts: FILE_STORE_ATTEMPTS,
  });
}

function isStorageProvider(value: string): value is StorageProvider {
  return (STORAGE_PROVIDERS as readonly string[]).includes(value);
}

/** The env schema already refuses a partial set; this only narrows what it proved. */
function required(value: string | undefined): string {
  if (value === undefined) throw new Error('an OBJECT_STORE_ variable is missing');
  return value;
}
