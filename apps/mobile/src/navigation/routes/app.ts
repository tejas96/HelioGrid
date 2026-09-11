import { CompanySignupScreen } from '../../screens/company-signup';
import { HomeScreen } from '../../screens/home';
import { useHasNoTenant, useHasTenant } from '../guards';

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
 * The tab navigator lived here; it was built on the v1 design system and
 * was removed with it. The new shell is `AppShell` + `BottomNav` from the V2 design system
 * (docs/engineering/17-ui-architecture-v2.md) and re-enters here when it is built.
 */
export const appScreens = {
  Home: { screen: HomeScreen, if: useHasTenant },
  /** A verified number with no company yet lands on the company step (`SCR-M01-01` decision 1, `M01-10`). */
  CompanySetup: { screen: CompanySignupScreen, if: useHasNoTenant },
};
