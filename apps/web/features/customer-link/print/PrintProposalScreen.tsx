'use client';
import type { ProposalDocument } from '@heliogrid/contracts';
import {
  proposalReaderLanguage,
  usePrintableProposal,
  useProposalReaderDocument,
} from '@heliogrid/data/react';
import { IN_PACK } from '@heliogrid/domain';
import { proposalDocumentReadWords, proposalDocumentTitle } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';
import { ProposalPrintDocument } from '@heliogrid/ui/print';
import { CustomerReader } from '../components/CustomerReader';
import { usePrintReady, usePrintRefused, usePrintTitle } from './hooks/use-print-ready';

/**
 * The printer's page (`T-M06-017`): one frozen version, drawn by the same parts as the preview, the
 * document screen and the customer's link — the proposal has ONE renderer, so its PDF cannot differ
 * (`F5-38`). Only the document renderer opens it, with a short-lived grant; a grant that does not
 * hold draws nothing, never says it is ready, and says at once that it was refused.
 */
export function PrintProposalScreen({ versionId, grant }: { versionId: string; grant: string }) {
  const read = usePrintableProposal(versionId, grant);
  const document = read.kind === 'ready' ? read.value : null;
  return (
    <CustomerReader language={proposalReaderLanguage(document)}>
      {document === null ? (
        <PrintedNothing refused={read.kind === 'failed'} />
      ) : (
        <PrintedDocument document={document} />
      )}
    </CustomerReader>
  );
}

function PrintedNothing({ refused }: { refused: boolean }) {
  usePrintReady(false);
  usePrintRefused(refused);
  return null;
}

function PrintedDocument({ document }: { document: ProposalDocument }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  /* The launch market's tax name, until a version's read carries its own market's. */
  const pages = useProposalReaderDocument({ document }, format, IN_PACK.tax.scheme, (input) =>
    proposalDocumentReadWords(t, { ...input, format }),
  );
  /* Drawn in the document's own language, which the reader's mount has reached by now. */
  usePrintReady(pages !== null && locale === pages.snapshot.language);
  usePrintTitle(
    proposalDocumentTitle(t, { number: document.number, company: document.company.name }),
  );
  return pages === null ? null : (
    <div>
      <ProposalPrintDocument snapshot={pages.snapshot} facts={pages.facts} words={pages.words} />
    </div>
  );
}
