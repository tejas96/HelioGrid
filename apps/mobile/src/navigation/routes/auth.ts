import { LoginScreen } from '../../screens/login';

/**
 * Screens visible only while signed out. The gate is stated ONCE, by the Auth group in
 * root.tsx — never per screen here.
 */
export const authScreens = {
  Login: { screen: LoginScreen },
};
