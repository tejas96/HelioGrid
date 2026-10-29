import type { TranslatedText } from '@heliogrid/contracts';
import { RichTextView } from '../RichText/RichTextView';
import { BandTitle } from './DocumentBands';
import type { DocumentRichTextValue } from './DocumentPreview.types';
import { TERMS_FONT_SIZE } from './DocumentTerms.logic';

interface DocumentTermsBandProps {
  title: TranslatedText | undefined;
  value: DocumentRichTextValue | undefined;
  logoSrc: string | undefined;
  logoLabel: TranslatedText;
  emptyText: TranslatedText | undefined;
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
export function DocumentTermsBand({
  title,
  value,
  logoSrc,
  logoLabel,
  emptyText,
}: DocumentTermsBandProps) {
  return (
    <div>
      <div className="hg-doc-rule" />
      <BandTitle title={title} />
      <RichTextView
        className="hg-doc-terms"
        value={value}
        logoSrc={logoSrc}
        logoLabel={logoLabel}
        fontSize={TERMS_FONT_SIZE}
        emptyText={emptyText}
      />
    </div>
  );
}
