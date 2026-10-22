import { InviteLandingScreen } from '../../screens/invite-landing';

/**
 * Screens a link opens whether or not anyone is signed in. The gate is stated ONCE, by the Open
 * group in root.tsx — never per screen here.
 */
export const openScreens = {
  /** The invite text's link (`SCR-M01-08`, brief ruling 16): `heliogrid://invite/<token>`. */
  InviteLanding: { screen: InviteLandingScreen, linking: 'invite/:token' },
};
