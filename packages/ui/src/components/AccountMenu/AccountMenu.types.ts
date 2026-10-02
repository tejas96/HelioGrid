import type { MenuAlign } from '../Menu/Menu.types';

/**
 * The avatar's menu (`SCR-SHELL-01` decision 2): the published grievance contact (`F1-59`) and
 * sign-out (`MS12-19`) — two items, neither destructive, since sign-out keeps the person's work.
 * Every word arrives as a prop.
 */
export interface AccountMenuProps {
  /** The person's name — the avatar's initials. */
  name: string;
  /** The avatar button's accessible name: whose account, and what it opens. */
  triggerName: string;
  /** The list's accessible name. */
  menuLabel: string;
  grievanceLabel: string;
  signOutLabel: string;
  onGrievance: () => void;
  onSignOut: () => void;
  /** Which edge the list lines up with: the phone's top bar opens it leftward from the end. */
  align: MenuAlign;
}
