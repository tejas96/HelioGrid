/**
 * Where a stored file's bytes live (`forward-compat.md`'s provider-ref law): the store a row
 * names, so moving vendor is copying objects and re-pointing rows, never guessing. A vendor is a
 * new value here and a new set of store settings — never adapter code, because every store the
 * suite uses speaks the S3 API. `local` is the development container and never runs in
 * production. The migration mirrors this tuple as a pgEnum (invariant `enum-parity`); it never
 * crosses the wire.
 */
export const STORAGE_PROVIDERS = ['local'] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

/**
 * Every type a stored file may be. It GROWS with the slice that first stores a new type (Law 9),
 * and each kind in `rules.ts` takes a subset of it. Mirrored as a pgEnum (invariant `enum-parity`).
 */
export const FILE_CONTENT_TYPES = ['image/png', 'image/jpeg'] as const;
export type FileContentType = (typeof FILE_CONTENT_TYPES)[number];
