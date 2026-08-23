import { RichTextView } from '../RichText/RichTextView';
import type { DocumentRichTextValue } from './DocumentPreview.types';

/** The sheet is drawn at its 480px design width, so the terms body sets at 10px there. */
const TERMS_FONT_SIZE = 10;

const EMPTY_TEXT = 'No terms are attached to this template yet.';

interface DocumentTermsBandProps {
  title: string;
  value: DocumentRichTextValue | undefined;
  logoSrc: string | undefined;
  logoLabel: string;
}

/**
 * The authored T&C body, read-only — rendered through `RichTextView`, which is deliberately THE
 * ONE read-only renderer, so the document and the customer-link page cannot render the same marks
 * differently (`M06-51`).
 *
 * The band around it — the brand rule and the overline — is the document's, and stays here. Only
 * the block list is delegated. The ink comes from the sheet's own CSS (`.hg-doc-terms`), so a
 * link still takes `--hg-doc-ink` rather than the app's link colour.
 */
export function DocumentTermsBand({ title, value, logoSrc, logoLabel }: DocumentTermsBandProps) {
  return (
    <div>
      <div className="hg-doc-rule" />
      <p className="hg-doc-overline" data-spaced="true">
        {title}
      </p>
      <RichTextView
        className="hg-doc-terms"
        value={value}
        logoSrc={logoSrc}
        logoLabel={logoLabel}
        fontSize={TERMS_FONT_SIZE}
        emptyText={EMPTY_TEXT}
      />
    </div>
  );
}
