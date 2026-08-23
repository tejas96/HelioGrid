import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider/market-context';
import { DocumentItemsBand, DocumentSectionsBand, DocumentTranchesBand } from './DocumentBands';
import { DocumentBandHeader, DocumentCover, DocumentFooter } from './DocumentHeader';
import type { DocumentPart, DocumentPreviewProps } from './DocumentPreview.types';
import { DOCUMENT_DESIGN_WIDTH } from './DocumentPreview.types';
import { DocumentTermsBand } from './DocumentTerms';
import { bandFails, resolveDocument } from './document-model';

/** Per-instance geometry and the gated brand colours ride into DocumentPreview.css. */
type CssVars = CSSProperties & Record<`--${string}`, string>;

interface WebDocumentPreviewProps extends DocumentPreviewProps {
  className?: string;
  style?: CSSProperties;
}

function sheetVars(
  doc: ReturnType<typeof resolveDocument>,
  style: CSSProperties | undefined,
): CssVars {
  return {
    '--hg-doc-width': `${doc.width}px`,
    '--hg-doc-design-width': `${DOCUMENT_DESIGN_WIDTH}px`,
    '--hg-doc-scale': `${doc.scale}`,
    '--hg-doc-brand': doc.brandHex,
    '--hg-doc-band-text': doc.bandTextColor,
    '--hg-doc-ink': doc.ink,
    '--hg-doc-rule-opacity': doc.ruleOpaque ? '1' : '0.55',
    ...(doc.sheetHeight === undefined
      ? {}
      : {
          '--hg-doc-sheet-height': `${doc.sheetHeight}px`,
          '--hg-doc-window-height': `${doc.sheetHeight * doc.scale}px`,
        }),
    ...style,
  };
}

/**
 * The customer-facing document, drawn with the tenant's brand — the subject a settings screen's
 * `PreviewFrame` hosts.
 *
 * It is ONE OF THE TWO SURFACES `F7-07` brands, not the boundary of tenant branding; the other
 * is the customer-link page, scoped by `CustomerSurface`. What both have in common is that the
 * operator application is never restyled.
 *
 * FRAMING IS NOT ITS JOB. `width` still works standalone, but the scaling, cropping, caption and
 * non-interactive guarantee of a preview belong to `PreviewFrame`. Pass `caption=""` inside one.
 *
 * It shares the contrast maths with `CustomerSurface`, so the two never disagree about which
 * text colour the header takes — and when a colour can't carry text it previews the honest
 * consequence (white header, brand rule) instead of a flattering mock.
 */
export function DocumentPreview({ className, style, ...props }: WebDocumentPreviewProps) {
  const doc = resolveDocument(props, useFormat());
  const has = (part: DocumentPart) => doc.parts.includes(part);

  return (
    <figure className={classNames('hg-doc', className)} style={sheetVars(doc, style)}>
      <div className="hg-doc-window">
        <div className="hg-doc-sheet">
          <DocumentBandHeader doc={doc} />
          {has('cover') ? <DocumentCover doc={doc} /> : null}
          <div className="hg-doc-body">
            {has('items') ? <DocumentItemsBand doc={doc} /> : null}
            {has('sections') ? <DocumentSectionsBand doc={doc} /> : null}
            {has('tranches') ? <DocumentTranchesBand doc={doc} /> : null}
            {has('terms') ? (
              <DocumentTermsBand
                title={doc.termsTitle}
                value={props.terms}
                logoSrc={doc.logoSrc}
                logoLabel={doc.logoLabel}
              />
            ) : null}
          </div>
          <DocumentFooter doc={doc} />
        </div>
      </div>
      {doc.caption === '' ? null : (
        <figcaption className="hg-doc-caption">
          {doc.caption}
          {doc.bandOk ? null : (
            <span className="hg-doc-caption-note">
              This colour can't carry header text, so the document keeps a white header and uses it
              as a rule.
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** Does this colour force the white-header consequence? A frame's `note` can say so above the sheet. */
DocumentPreview.bandFails = bandFails;
