/**
 * Frame 8 (`S1.wrong.4`): the company removed this person, said plainly, with one way on — sign
 * out to the door — and the grievance contact still in reach, since a removed person is still a
 * data subject (`F1-59`). "Contact your admin" opened nothing, so it is never offered. Every word
 * arrives as a prop.
 */
export interface AccessRemovedProps {
  /** "Your access to {company} was removed", or plainly when the name never loaded. */
  title: string;
  description: string;
  /** "Sign in with another account". */
  actionLabel: string;
  /** Pressed once only: the action turns off, keeping its name, so a second press sends nothing. */
  onAction: () => void;
  grievanceLabel: string;
  onGrievance: () => void;
}
