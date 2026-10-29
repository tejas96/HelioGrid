import type { TranslatedText } from '@heliogrid/contracts';
/**
 * Frame 8 (`S1.wrong.4`): the company removed this person, said plainly, with one way on — sign
 * out to the door — and the grievance contact still in reach, since a removed person is still a
 * data subject (`F1-59`). "Contact your admin" opened nothing, so it is never offered. Every word
 * arrives as a prop.
 */
export interface AccessRemovedProps {
  /** "Your access to {company} was removed", or plainly when the name never loaded. */
  title: TranslatedText;
  description: TranslatedText;
  /** "Sign in with another account". */
  actionLabel: TranslatedText;
  onAction: () => void;
  /** The sign-out is out: the action turns off, keeping its name, so a second press sends nothing. */
  pending: boolean;
  grievanceLabel: TranslatedText;
  onGrievance: () => void;
}
