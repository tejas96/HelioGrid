/**
 * The notice a company's EPC Owner reads when someone signing up asks to be added to it
 * (`M01-09`). The api renders it in the OWNER's language when the request arrives and stores it as
 * written (`F6-08`), so these words are the record's, never re-translated on read.
 */
import type { MessageRef, Translator } from '../runtime';

const JOIN_REQUEST_NOTICE = {
  title: /*i18n*/ { id: '{name} asks to join' },
  body: /*i18n*/ { id: '{phone} asked to be added to {company}.' },
} satisfies Record<string, MessageRef>;

/** Who asked, as the owner reads it: the name they typed and their number in the owner's format. */
export interface JoinRequestAsker {
  readonly name: string;
  readonly phone: string;
}

export function joinRequestNotice(
  translate: Translator['t'],
  asker: JoinRequestAsker,
  company: string,
): { title: string; body: string } {
  return {
    title: translate(JOIN_REQUEST_NOTICE.title, { name: asker.name }),
    body: translate(JOIN_REQUEST_NOTICE.body, { phone: asker.phone, company }),
  };
}
