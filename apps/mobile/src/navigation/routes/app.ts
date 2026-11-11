import { DOOR_SEGMENT } from '@heliogrid/domain';
import { BillingPlansScreen } from '../../screens/billing';
import { CompanyProfileScreen } from '../../screens/company-profile';
import { CompanySignupScreen } from '../../screens/company-signup';
import { CustomerMergeScreen } from '../../screens/customer-merge';
import { FirstRunProfileScreen } from '../../screens/first-run-profile';
import { LeadDetailScreen } from '../../screens/lead-detail';
import { LeadImportScreen } from '../../screens/lead-import';
import { LeadInboxScreen } from '../../screens/lead-inbox';
import { LeadsListScreen } from '../../screens/leads-list';
import {
  ProjectDetailScreen,
  ProjectDocumentsScreen,
  ProjectStepsScreen,
} from '../../screens/project-detail';
import { ProjectHandoverScreen } from '../../screens/project-handover';
import { ProjectsBoardScreen } from '../../screens/projects-board';
import { QuickAddLeadScreen } from '../../screens/quick-add-lead';
import { RoleExplainerScreen } from '../../screens/role-explainer';
import { SearchScreen } from '../../screens/search';
import { SettingsRowScreen, SettingsScreen } from '../../screens/settings';
import { SetupInviteTeamScreen } from '../../screens/setup-invite-team';
import { SetupLanguageScreen } from '../../screens/setup-language';
import { SetupReadyScreen } from '../../screens/setup-ready';
import { SetupWhatYouSellScreen } from '../../screens/setup-what-you-sell';
import { PlaceholderScreen, ShellScreen } from '../../screens/shell';
import { doorRoute, placeholderRoutes } from '../../screens/shell/doors';
import {
  firstRunRoute,
  roleExplainerRoute,
  useHasHome,
  useHasNoTenant,
  useOwesCompanyProfileStep,
  useOwesInviteTeamStep,
  useOwesLanguageStep,
  useOwesReadyStep,
  useOwesWhatYouSellStep,
  useShowsShell,
} from '../guards';

/**
 * Authenticated routes.
 *
 * Adding a module's screen is ONE entry in this object: its param type, its deep link
 * (`linking: 'leads/:leadId'`) and its auth gate all follow from it. Params come from the
 * screen's own `StaticScreenProps<…>`, so they are never declared twice.
 *
 * When roles land, group by CAPABILITY — never by role. Roles are stackable, so a role-keyed
 * group would declare a shared screen twice, and duplicate route names are a hard throw.
 *
 * Every door the shell opens exists, so no control is dead: each module's screen replaces its
 * placeholder when it lands (`T-SHELL-001`'s Used by). A door's link is domain's address for it, the
 * one the web serves (`M01-61`).
 */
export const appScreens = {
  Shell: { screen: ShellScreen, if: useShowsShell },
  /** The step after a join that named the account from the invite (`SCR-M01-09`); the landing opens it. */
  [firstRunRoute]: { screen: FirstRunProfileScreen, if: useHasHome },
  /** The role card at first run (`SCR-M01-10`); First-Run Profile or the landing opens it. */
  [roleExplainerRoute]: { screen: RoleExplainerScreen, if: useHasHome },
  /** A verified number with no company yet lands on the company step (`SCR-M01-01` decision 1, `M01-10`). */
  CompanySetup: { screen: CompanySignupScreen, if: useHasNoTenant },
  /** An owner whose company still owes its first setup step lands here before the shell (`SCR-M01-03`, `F3-03`). */
  SetupLanguage: { screen: SetupLanguageScreen, if: useOwesLanguageStep },
  /** Then the step that asks what the company sells (`SCR-M01-04`, `M01-23`). */
  SetupWhatYouSell: { screen: SetupWhatYouSellScreen, if: useOwesWhatYouSellStep },
  /** Then the company profile, skippable: its act is live with nothing filled in (`SCR-M01-05`, `M01-24`). */
  SetupCompanyProfile: { screen: CompanyProfileScreen, if: useOwesCompanyProfileStep },
  /** Then the first invite, skippable (`SCR-M01-07`, `M01-12`). */
  SetupInviteTeam: { screen: SetupInviteTeamScreen, if: useOwesInviteTeamStep },
  /** Then the corridor's end: two doors, and the first taken closes setup (`SCR-M01-06`, `M01-26`). */
  SetupReady: { screen: SetupReadyScreen, if: useOwesReadyStep },
  /*
   * Every door whose module has not landed, drawn by `PlaceholderScreen` at domain's address for it:
   * one row per door of `PLACEHOLDER_DOORS` (`screens/shell/doors.ts`), so a door, its route and its
   * link cannot disagree. A module's screen takes its door out of that list and its row in here.
   */
  ...placeholderRoutes((door) => ({
    screen: PlaceholderScreen,
    if: useHasHome,
    linking: DOOR_SEGMENT[door],
  })),
  /** The Leads list (`SCR-M02-03`), the pill's Leads door. */
  [doorRoute.leads]: { screen: LeadsListScreen, if: useHasHome, linking: DOOR_SEGMENT.leads },
  /** The morning triage (`SCR-M02-02`): the Leads screen opens it, as the web's `/leads/inbox`. */
  LeadInbox: { screen: LeadInboxScreen, if: useHasHome, linking: `${DOOR_SEGMENT.leads}/inbox` },
  /**
   * The Lead Import Wizard (`SCR-M02-05`), as the web's `/leads/import`: the inbox's and the list's
   * Import open it, and an import's notice opens `?job=<id>` where it stands.
   */
  LeadImport: { screen: LeadImportScreen, if: useHasHome, linking: `${DOOR_SEGMENT.leads}/import` },
  /**
   * One lead (`SCR-M02-04`) at `leads/<id>`, the address a list, a search result and a lead notice
   * open (`subjectAddressOf`). The inbox's fixed segment above wins over the id.
   */
  LeadDetail: {
    screen: LeadDetailScreen,
    if: useHasHome,
    linking: `${DOOR_SEGMENT.leads}/:leadId`,
  },
  /** The Projects board (`SCR-M08-01`), the pill's Projects door. */
  [doorRoute.projects]: {
    screen: ProjectsBoardScreen,
    if: useHasHome,
    linking: DOOR_SEGMENT.projects,
  },
  /**
   * One project (`SCR-M08-02`) at `projects/<id>`, the address the board, a project notice and
   * *Mark won* open (`subjectAddressOf`); its checklist and its handover sit under it.
   */
  ProjectDetail: {
    screen: ProjectDetailScreen,
    if: useHasHome,
    linking: `${DOOR_SEGMENT.projects}/:projectId`,
  },
  ProjectDocuments: {
    screen: ProjectDocumentsScreen,
    if: useHasHome,
    linking: `${DOOR_SEGMENT.projects}/:projectId/documents`,
  },
  ProjectSteps: {
    screen: ProjectStepsScreen,
    if: useHasHome,
    linking: `${DOOR_SEGMENT.projects}/:projectId/steps`,
  },
  ProjectHandover: {
    screen: ProjectHandoverScreen,
    if: useHasHome,
    linking: `${DOOR_SEGMENT.projects}/:projectId/handover`,
  },
  /**
   * Customer Merge (`SCR-M02-06`) at `customers/merge?survivorId=…&loserId=…`, as the web's
   * `/customers/merge`: Lead Detail's More menu opens it with this lead's customer.
   */
  CustomerMerge: { screen: CustomerMergeScreen, if: useHasHome, linking: 'customers/merge' },
  /** `More` opens the settings list (`SCR-SHELL-01`, *More: the settings list*); a row's screen replaces its placeholder when it lands. */
  [doorRoute.more]: { screen: SettingsScreen, if: useHasHome, linking: DOOR_SEGMENT.more },
  SettingsRow: {
    screen: SettingsRowScreen,
    if: useHasHome,
    linking: `${DOOR_SEGMENT.more}/:segment`,
  },
  /** The plans billing's `Change plan` opens (`SCR-M12-03`): the *coming later* page until it lands. */
  BillingPlans: {
    screen: BillingPlansScreen,
    if: useHasHome,
    linking: `${DOOR_SEGMENT.more}/billing/plans`,
  },
  /**
   * Quick add (`SCR-M02-01`): the pill's add action opens it as a sheet over the leads page; the page
   * fades in under the sheet's own rise, so the move reads as one sheet, not a page and a sheet.
   */
  [doorRoute.add_lead]: {
    screen: QuickAddLeadScreen,
    if: useHasHome,
    linking: DOOR_SEGMENT.add_lead,
    options: { animation: 'fade' as const },
  },
  /** Global Search (`SCR-SHELL-02`): the top bar's search rises as a full-height sheet over the page. */
  [doorRoute.search]: {
    screen: SearchScreen,
    if: useHasHome,
    linking: DOOR_SEGMENT.search,
    options: { animation: 'slide_from_bottom' as const },
  },
};
