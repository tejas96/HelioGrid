import type { ReactNode } from 'react';

/** Every word the frame draws; `@heliogrid/i18n`'s `requestSentWords` writes them. */
export interface SignupRequestSentWords {
  title: string;
  /** Whose owner holds the request, and how the answer arrives. */
  body: string;
  /** Over the asker's name and number. */
  sentAs: string;
  /** Over the one route back to creating. */
  prompt: string;
  createInstead: string;
}

/**
 * Where *Request to join* lands (`M01-09`; `SCR-M01-02` `m-request-sent`, `d-request-sent`,
 * decisions 19 and 24): what was sent and to whom, who it was sent as, and the one route back to
 * creating, held at the column's foot. Off the flow, so it carries no step header.
 */
export interface SignupRequestSentProps {
  /** The door's language control, in the header row. */
  language: ReactNode;
  words: SignupRequestSentWords;
  /** The asker's name as the request carries it. */
  name: string;
  /** The asker's number, in E.164. */
  phoneE164: string;
  onCreateInstead: () => void;
}
