/**
 * Where a file's bytes sit in the store: the company, then the file, both ids the server minted.
 * Nothing a client sent — a name, a path — ever reaches a key, so no upload can land outside its
 * own company's prefix.
 */
export function objectKeyOf(tenantId: string, fileId: string): string {
  return `${tenantId}/${fileId}`;
}

/**
 * Where a document the platform made sits: the company, then the record it belongs to. One key per
 * record, so a step that runs again stores over its own bytes and never leaves a second object.
 */
export function documentKeyOf(tenantId: string, subjectKind: string, subjectRef: string): string {
  return `${tenantId}/${subjectKind}/${subjectRef}`;
}
