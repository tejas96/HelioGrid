import { describe, expect, it } from 'vitest';
import { objectStoreFor } from '../../src/modules/file/internal/object-store.binding';
import { MemoryObjectStore } from '../../src/modules/file/internal/object-store.memory';
import { S3ObjectStore } from '../../src/modules/file/internal/object-store.s3';

/**
 * Which store a boot binds, from its settings alone (`T-FPLAT-035` C16, D7). Production never runs
 * on a store that forgets its files, and never on the development container.
 */
const configured = {
  OBJECT_STORE_PROVIDER: 'local',
  OBJECT_STORE_ENDPOINT: 'http://127.0.0.1:9000',
  OBJECT_STORE_REGION: 'us-east-1',
  OBJECT_STORE_BUCKET: 'heliogrid-files-local',
  OBJECT_STORE_ACCESS_KEY_ID: 'heliogrid',
  OBJECT_STORE_SECRET_ACCESS_KEY: 'heliogrid-local-secret',
  OBJECT_STORE_FORCE_PATH_STYLE: true,
} as const;
const none = {
  OBJECT_STORE_PROVIDER: undefined,
  OBJECT_STORE_ENDPOINT: undefined,
  OBJECT_STORE_REGION: undefined,
  OBJECT_STORE_BUCKET: undefined,
  OBJECT_STORE_ACCESS_KEY_ID: undefined,
  OBJECT_STORE_SECRET_ACCESS_KEY: undefined,
  OBJECT_STORE_FORCE_PATH_STYLE: true,
} as const;
const quiet = () => {};

describe('objectStoreFor — the store a boot binds', () => {
  it('production refuses the local store and a missing one', () => {
    expect(() => objectStoreFor({ NODE_ENV: 'production', ...configured }, quiet)).toThrow(
      /never runs in production/,
    );
    expect(() => objectStoreFor({ NODE_ENV: 'production', ...none }, quiet)).toThrow(
      /No object store configured/,
    );
  });

  it('refuses a provider the vocabulary does not know, in any environment', () => {
    const unknown = { ...configured, OBJECT_STORE_PROVIDER: 'tigris' };
    expect(() => objectStoreFor({ NODE_ENV: 'development', ...unknown }, quiet)).toThrow(
      /is not one of: local/,
    );
  });

  it('the store is built from settings alone', () => {
    const store = objectStoreFor({ NODE_ENV: 'development', ...configured }, quiet);
    expect(store).toBeInstanceOf(S3ObjectStore);
    expect(store.provider).toBe('local');
  });

  it('holds files in memory, and says so, on a development machine with no store', () => {
    const warned: string[] = [];
    const store = objectStoreFor({ NODE_ENV: 'development', ...none }, (m) => warned.push(m));
    expect(store).toBeInstanceOf(MemoryObjectStore);
    expect(warned).toHaveLength(1);
  });

  it('never reaches a real store under test, even one that is configured', () => {
    expect(objectStoreFor({ NODE_ENV: 'test', ...configured }, quiet)).toBeInstanceOf(
      MemoryObjectStore,
    );
  });
});
