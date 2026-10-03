import { CompanySignupScreen } from '../../screens/company-signup';
import { PlaceholderScreen, ShellScreen } from '../../screens/shell';
import { useHasHome, useHasNoTenant, useShowsShell } from '../guards';

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
 * placeholder when it lands (`T-SHELL-001`'s Used by).
 */
export const appScreens = {
  Shell: { screen: ShellScreen, if: useShowsShell },
  /** A verified number with no company yet lands on the company step (`SCR-M01-01` decision 1, `M01-10`). */
  CompanySetup: { screen: CompanySignupScreen, if: useHasNoTenant },
  Leads: { screen: PlaceholderScreen, if: useHasHome },
  Proposals: { screen: PlaceholderScreen, if: useHasHome },
  Projects: { screen: PlaceholderScreen, if: useHasHome },
  People: { screen: PlaceholderScreen, if: useHasHome },
  Campaigns: { screen: PlaceholderScreen, if: useHasHome },
  More: { screen: PlaceholderScreen, if: useHasHome },
  QuickAddLead: { screen: PlaceholderScreen, if: useHasHome },
  StartSurvey: { screen: PlaceholderScreen, if: useHasHome },
  Search: { screen: PlaceholderScreen, if: useHasHome },
};
