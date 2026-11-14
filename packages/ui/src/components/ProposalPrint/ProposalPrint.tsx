import { proposalSheetsOf, sheetKey } from '@heliogrid/domain';
import { usePageSize } from '../../utils/page-size';
import { ProposalPage } from '../ProposalPages';
import type { ProposalPrintDocumentProps } from './ProposalPrint.types';

/**
 * The whole document as it prints: every sheet of the page plan at its design size, on A4 with no
 * page margin (the page carries its own), backgrounds printed (`print.css`). Held still — a page is
 * never caught mid-arrival — so the PDF is the same parts over the same values as the screen
 * (`M06-50`, `F5-38`).
 */
export function ProposalPrintDocument({ snapshot, facts, words }: ProposalPrintDocumentProps) {
  usePageSize({ paper: 'a4', orientation: 'portrait' });
  return (
    <div className="hg-pp-print">
      {proposalSheetsOf(snapshot.pages, snapshot.fields).map((sheet) => (
        <div className="hg-pp-sheet" key={sheetKey(sheet)}>
          <ProposalPage
            page={sheet.page}
            part={sheet.part}
            snapshot={snapshot}
            facts={facts}
            words={words}
            still
          />
        </div>
      ))}
    </div>
  );
}
