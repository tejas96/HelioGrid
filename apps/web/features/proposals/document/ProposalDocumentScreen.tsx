'use client';
import { useProposalReaderScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  proposalDocumentSummary,
  proposalPageHeadWords,
  proposalReaderWords,
  proposalScreenSaid,
} from '@heliogrid/i18n';
import {
  IconButton,
  ProposalReader,
  readerPageWidth,
  ShellGlyph,
  useOwnWidth,
} from '@heliogrid/ui';
import { OneToast } from '../../../lib/one-toast';
import { PROPOSAL_WIDE_FROM } from '../shared/constants';
import { ProposalPageHead } from '../shared/ProposalPageHead';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { useProposalMoves } from '../shared/use-proposal-moves';
import { useProposalPages } from '../shared/use-proposal-pages';

import '../shared/proposals.css';

/**
 * A proposal's document on the web (`SCR-M06-17`, `T-M06-015`): the rep reads exactly what the
 * customer will — the same pages the link and the PDF draw — before it goes out, and shares or
 * downloads it from here. What is read is `useProposalReaderScreen`'s, the phone's too; the web's
 * own parts are the page's width and the PDF's tab.
 */
export function ProposalDocumentScreen({
  proposalId,
  version,
}: {
  proposalId: string;
  /** The version the address names; `null` reads the newest. */
  version: number | null;
}) {
  const { t, formats } = useProposalFormats();
  const moves = useProposalMoves();
  const screen = useProposalReaderScreen(proposalId, version, {
    toBuilder: moves.toBuilder,
    toShare: moves.toShare,
    openFile: moves.openFile,
  });
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= PROPOSAL_WIDE_FROM;
  const head = proposalPageHeadWords(t, formats);
  const said = proposalScreenSaid(t);
  const detail = screen.proposal.kind === 'ready' ? screen.proposal.value : null;
  const name = head.name(detail?.document.number ?? null);
  const customer = detail?.document.deal.clientName ?? null;
  const read = screen.read.kind === 'ready' ? screen.read.value : null;
  const pages = useProposalPages(read);
  const { file } = screen.pdf;
  const words = proposalReaderWords(t, customer, detail?.document.deal.segment ?? null);
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-proposal-page">
      <ProposalPageHead
        wide={wide}
        trail={[
          { label: destinationLabel(t, 'proposals'), onOpen: moves.toList },
          { label: name, onOpen: () => moves.toProposal(proposalId) },
        ]}
        here={head.document}
        label={head.trail}
        title={head.documentTitle(detail?.document.number ?? null, screen.version)}
        summary={
          read === null
            ? undefined
            : proposalDocumentSummary(t, formats, {
                customerName: read.deal.clientName,
                capacityKw: read.fields.system.capacityKw,
                yearlyKwh: read.generation?.yearlyKwh ?? null,
              })
        }
        mono={detail?.document.number != null}
        barActs={
          <IconButton label={words.pdf} onClick={screen.getPdf}>
            <ShellGlyph name="download" size="sm" tone="primary" />
          </IconButton>
        }
      />
      <div className="hg-proposal-document">
        <ProposalReader
          read={screen.drawn(pages)}
          words={words}
          room={wide ? 'wide' : 'narrow'}
          pageWidth={readerPageWidth(width, wide)}
          pending={screen.pending}
          {...(screen.newVersion === null ? {} : { onNewVersion: screen.newVersion })}
          {...(screen.share === null ? {} : { onShare: screen.share })}
          {...(wide ? { onPdf: screen.getPdf } : {})}
          focusAfter={room}
        />
      </div>
      <OneToast
        fact={file.kind === 'late' || file.kind === 'unread' ? file : null}
        line={(late) => ({
          tone: 'warning',
          title: late.kind === 'late' ? said.pdfLate : said.pdfFailed,
        })}
        onDismiss={screen.pdf.lookAgain}
        focusAfter={room}
      />
    </div>
  );
}
