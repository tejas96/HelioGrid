import { BILLING_ROWS } from './billing';
import { CRM_ROWS } from './crm';
import { CUSTOMER_LINK_ROWS } from './customer-link';
import { FIELD_ROWS } from './field';
import { HR_ROWS } from './hr';
import { MARKETING_ROWS } from './marketing';
import { ONBOARDING_ROWS } from './onboarding';
import { PAYMENTS_ROWS } from './payments';
import { PROJECTS_ROWS } from './projects';
import { PROPOSALS_ROWS } from './proposals';
import { REPORTS_ROWS } from './reports';
import { SALES_ROWS } from './sales';
import { STUDIO_ROWS } from './studio';
import { SURVEY_ROWS } from './survey';

/**
 * The capability matrix — the rows of `docs/prd/foundations/F2-roles-and-permissions.md`
 * §F2.5, one file per product area beside this one, named for what it holds and never for the
 * PRD's module number, joined here so the guard's argument is exhaustively typed across the
 * suite.
 *
 * Only a row the PRD already FIXES is here. A placeholder row lands in its module's file with
 * that module's first slice (Law 9) and joins the union the moment it does; the union is never
 * widened by a screen or a handler.
 *
 * Rows are phrased as ACTS, never as CRUD on entities (F2-25, journey L1440–1441). "Manage
 * team and roles" is a row; "update users" is not.
 */
export const CAPABILITY_MATRIX = {
  ...BILLING_ROWS,
  ...CRM_ROWS,
  ...CUSTOMER_LINK_ROWS,
  ...FIELD_ROWS,
  ...HR_ROWS,
  ...MARKETING_ROWS,
  ...ONBOARDING_ROWS,
  ...PAYMENTS_ROWS,
  ...PROJECTS_ROWS,
  ...PROPOSALS_ROWS,
  ...REPORTS_ROWS,
  ...SALES_ROWS,
  ...STUDIO_ROWS,
  ...SURVEY_ROWS,
} as const;

/**
 * Every capability the suite knows, by id: `crm.add_edit_leads` for row `F2.M02.add-edit-leads`.
 * The code names the area, the PRD numbers it.
 */
export type Capability = keyof typeof CAPABILITY_MATRIX;
