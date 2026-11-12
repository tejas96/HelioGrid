import { readsCompanyWide } from '@heliogrid/domain';
import type { Request } from 'express';
import { type LeadReader, readerOf } from '../../crm/crm.public';
import { type ProjectReader, projectReaderOf } from '../../projects/projects.public';

export { COMPANY_REPORTS, readsCompanyWide } from '@heliogrid/domain';

/** Who reads the dashboard: their leads' reach, their projects' reach, and whether company-wide. */
export interface DashboardReader {
  readonly leads: LeadReader;
  readonly projects: ProjectReader;
  readonly companyWide: boolean;
}

export function dashboardReaderOf(req: Request): DashboardReader {
  const leads = readerOf(req);
  return {
    leads,
    projects: projectReaderOf(req),
    companyWide: readsCompanyWide(leads.roles),
  };
}
