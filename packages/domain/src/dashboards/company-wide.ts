import { can, limitsOn } from '../authz/policy';
import type { RolePreset } from '../authz/roles';

/** The capability every dashboard figure rides on (`F2.M13.company-reports`). */
export const COMPANY_REPORTS = 'reports.company_reports' as const;

/**
 * Whether the presets read the company's reports company-wide — the EPC Owner's `all` cell, or an
 * outright grant — rather than a team's (`M13-07`). Only such a reader sets the company target and
 * receives the company's monthly summary, whose figures are the whole company's.
 */
export function readsCompanyWide(roles: readonly RolePreset[]): boolean {
  if (!can(roles, COMPANY_REPORTS)) return false;
  const limits = limitsOn(roles, COMPANY_REPORTS);
  return limits.length === 0 || limits.includes('all');
}
