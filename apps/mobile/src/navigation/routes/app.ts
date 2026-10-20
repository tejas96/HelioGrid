import { DOOR_SEGMENT } from '@heliogrid/domain';
import { CompanyProfileScreen } from '../../screens/company-profile';
import { CompanySignupScreen } from '../../screens/company-signup';
import { SettingsRowScreen, SettingsScreen } from '../../screens/settings';
import { SetupInviteTeamScreen } from '../../screens/setup-invite-team';
import { SetupLanguageScreen } from '../../screens/setup-language';
import { SetupWhatYouSellScreen } from '../../screens/setup-what-you-sell';
import { PlaceholderScreen, ShellScreen } from '../../screens/shell';
import {
  useHasHome,
  useHasNoTenant,
  useOwesCompanyProfileStep,
  useOwesInviteTeamStep,
  useOwesLanguageStep,
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
  Leads: { screen: PlaceholderScreen, if: useHasHome, linking: DOOR_SEGMENT.leads },
  Proposals: { screen: PlaceholderScreen, if: useHasHome, linking: DOOR_SEGMENT.proposals },
  Projects: { screen: PlaceholderScreen, if: useHasHome, linking: DOOR_SEGMENT.projects },
  People: { screen: PlaceholderScreen, if: useHasHome, linking: DOOR_SEGMENT.people },
  Campaigns: { screen: PlaceholderScreen, if: useHasHome, linking: DOOR_SEGMENT.campaigns },
  /** `More` opens the settings list (`SCR-SHELL-01`, *More: the settings list*); a row's screen replaces its placeholder when it lands. */
  More: { screen: SettingsScreen, if: useHasHome, linking: DOOR_SEGMENT.more },
  SettingsRow: {
    screen: SettingsRowScreen,
    if: useHasHome,
    linking: `${DOOR_SEGMENT.more}/:segment`,
  },
  QuickAddLead: { screen: PlaceholderScreen, if: useHasHome, linking: DOOR_SEGMENT.add_lead },
  StartSurvey: { screen: PlaceholderScreen, if: useHasHome, linking: DOOR_SEGMENT.start_survey },
  Search: { screen: PlaceholderScreen, if: useHasHome, linking: DOOR_SEGMENT.search },
};
