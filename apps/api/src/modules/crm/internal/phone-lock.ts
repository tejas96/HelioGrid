/**
 * The key one number's saves queue on, per company (`M02-66`): a capture and a contact of the same
 * number re-check and insert one at a time, so the second meets the first's record.
 */
export function phoneLockKey(tenantId: string, phoneE164: string): string {
  return `crm-phone:${tenantId}:${phoneE164}`;
}
