import type { ProposalDetail } from '@heliogrid/contracts';
import { type ProposalTrackScreen, useProposalMarketNames } from '@heliogrid/data/react';
import {
  messageSheetWords,
  proposalActFailureWords,
  proposalScreenSaid,
  shareToastWords,
  taxNumberNoticeWords,
} from '@heliogrid/i18n';
import { type FocusAfter, MessageSheet } from '@heliogrid/ui';
import { OneToast, type ToastLine } from '../../shared/OneToast';
import { languageNameOf, useProposalFormats } from '../../shared/use-proposal-formats';

const SHEETS = ['share', 'thank', 'crew'] as const;
const WITHDRAWN = { kind: 'withdrawn' } as const;

type Said =
  | NonNullable<ProposalTrackScreen['said']>
  | typeof WITHDRAWN
  | { readonly kind: 'pdf'; readonly late: boolean };

/** What the screen has to say once: the last hand-off, a PDF that is late or failed, a withdrawal. */
function saidOf(screen: ProposalTrackScreen): Said | null {
  if (screen.said !== null) return screen.said;
  const pdf = screen.pdf.file.kind;
  if (pdf === 'late' || pdf === 'unread') return { kind: 'pdf', late: pdf === 'late' };
  return screen.withdraw.done ? WITHDRAWN : null;
}

/**
 * The sheets a proposal's hand-offs open — share, the thank-you after an Accept, the evening-before
 * crew message — and the one toast an act leaves above the pill. The person picks the chat and
 * sends; the first share sent with no tax number says so, and who may add it is offered *Add it*.
 */
export function TrackSheets({
  screen,
  detail,
  focusAfter,
}: {
  screen: ProposalTrackScreen;
  detail: ProposalDetail | null;
  focusAfter: FocusAfter;
}) {
  const { t, locale, format } = useProposalFormats();
  const { taxName } = useProposalMarketNames();
  const said = proposalScreenSaid(t);
  const customer = detail?.document.deal.clientName ?? null;
  const language = languageNameOf(detail?.document.language ?? locale);
  const notice =
    screen.withoutTaxNumber && detail !== null && taxName !== null
      ? taxNumberNoticeWords(t, {
          taxName,
          mayAdd: detail.rights.writesCompanyFacts,
          ownerName: detail.companyFactsBy?.name ?? null,
        })
      : null;
  const lineOf = (fact: Said): ToastLine => {
    if (fact.kind === 'withdrawn') return { tone: 'success', title: said.withdrawn };
    if (fact.kind === 'pdf') {
      return { tone: 'warning', title: fact.late ? said.pdfLate : said.pdfFailed };
    }
    if (fact.kind === 'message_copied') {
      return { tone: 'success', title: shareToastWords(t, '').messageCopied };
    }
    if (fact.kind === 'not_copied') return { tone: 'warning', title: said.notCopied };
    const toast = shareToastWords(
      t,
      fact.followUpOn === null ? null : format.date(fact.followUpOn),
    );
    return { tone: 'success', title: fact.kind === 'shared' ? toast.shared : toast.copied };
  };
  return (
    <>
      {SHEETS.map((kind) => {
        const open = screen.sheet === kind;
        const forShare = kind === 'share';
        return (
          <MessageSheet
            key={kind}
            open={open}
            onClose={screen.close}
            words={messageSheetWords(t, kind, {
              name: customer,
              segment: detail?.document.deal.segment ?? null,
              language,
              withoutTaxNumber: forShare && screen.withoutTaxNumber,
            })}
            message={screen.message}
            notice={
              forShare && notice !== null
                ? {
                    title: notice.title,
                    line: notice.line,
                    ...(detail?.rights.writesCompanyFacts === true
                      ? { act: { label: notice.add, onPress: screen.addTaxNumber } }
                      : {}),
                  }
                : null
            }
            pending={open ? screen.pending : null}
            failure={open ? proposalActFailureWords(t, screen.failure) : null}
            onShare={screen.share}
            onCopy={screen.copy}
            {...(forShare ? { onPdf: screen.getPdf } : {})}
          />
        );
      })}
      <OneToast
        fact={saidOf(screen)}
        line={lineOf}
        onDismiss={screen.dismissSaid}
        focusAfter={focusAfter}
      />
    </>
  );
}
