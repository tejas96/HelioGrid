import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';

/**
 * The operator's notice that a proposal version's PDF could not be made (`F5-39`): written in-app
 * after its render failed both tries. The api renders it in the RECIPIENT's language when it emits
 * and stores it as written (`F6-08`).
 */
const PROPOSAL_DOCUMENT_NOTICE = {
  title: /*i18n*/ { id: 'The PDF of proposal {number} could not be made' },
  body: /*i18n*/ {
    id: 'Version {version} did not print after two tries. The customer’s page still shows every figure. Ask for the PDF again to try once more.',
  },
} satisfies Record<string, MessageRef>;

interface NoticeText {
  title: TranslatedText;
  body: TranslatedText;
}

export function proposalDocumentFailedNotice(
  translate: Translator['t'],
  facts: { readonly number: string; readonly version: number },
): NoticeText {
  return {
    title: translate(PROPOSAL_DOCUMENT_NOTICE.title, { number: facts.number }),
    body: translate(PROPOSAL_DOCUMENT_NOTICE.body, { version: facts.version }),
  };
}
