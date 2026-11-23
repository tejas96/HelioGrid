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
 * and each kind in `rules.ts` takes a subset of it. Held in the database by the CHECK
 * `file_content_type_known` — the `.xlsx` type is longer than a pgEnum label may be — and read back
 * against the contract by invariant `enum-parity`.
 */
export const FILE_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  /** A piece of a picture with see-through edges, a drone map's (`T-M05-002d`). */
  'image/webp',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  /** A document the platform renders — an invoice's PDF (`M12-44`); no upload rule takes it. */
  'application/pdf',
  /** A plan's lines, read from a DWG, DXF or PDF (`T-M05-002d`): text the studio draws. */
  'application/json',
  /** A CAD plan read on the server alone (`CAD_PLAN_CONTENT_TYPES`): a DWG, or a DXF saved in binary. */
  'image/vnd.dwg',
  'image/vnd.dxf',
] as const;
export type FileContentType = (typeof FILE_CONTENT_TYPES)[number];
