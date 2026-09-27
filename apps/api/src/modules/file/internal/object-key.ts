/**
 * Where a file's bytes sit in the store: the company, then the file, both ids the server minted.
 * Nothing a client sent — a name, a path — ever reaches a key, so no upload can land outside its
 * own company's prefix.
 */
export function objectKeyOf(tenantId: string, fileId: string): string {
  return `${tenantId}/${fileId}`;
}
