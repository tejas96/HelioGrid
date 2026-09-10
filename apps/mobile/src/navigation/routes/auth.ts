import { CompanySignupScreen } from '../../screens/company-signup';
import { LoginScreen } from '../../screens/login';

/**
 * Screens visible only while signed out. The gate is stated ONCE, by the Auth group in
 * root.tsx — never per screen here.
 */
export const authScreens = {
  Login: { screen: LoginScreen },
  /** The door's "Create a company account" route — `T-M01-002`'s screen, a placeholder until it lands. */
  CompanySignup: { screen: CompanySignupScreen },
};
