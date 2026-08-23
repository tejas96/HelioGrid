import type { ResolvedDocument } from './document-model';

/** The labelled placeholder slot that stands in until a logo arrives. */
export function DocumentSlot({ label }: { label: string }) {
  return (
    <div className="hg-doc-slot">
      <span className="hg-doc-slot-label">{label}</span>
    </div>
  );
}

/**
 * The letterhead band. It takes the brand fill ONLY if something can be read on it; otherwise
 * the document keeps a white header and demotes the brand to a rule — the honest consequence,
 * previewed, because a preview that flatters a failing colour is worse than no preview.
 */
export function DocumentBandHeader({ doc }: { doc: ResolvedDocument }) {
  const lines = doc.letterhead?.lines;
  return (
    <header className="hg-doc-band" data-band-ok={doc.bandOk ? 'true' : 'false'}>
      <div className="hg-doc-band-words">
        <p className="hg-doc-company">{doc.companyName}</p>
        {doc.letterhead?.tagline === undefined ? null : (
          <p className="hg-doc-tagline">{doc.letterhead.tagline}</p>
        )}
        <p className="hg-doc-address">{doc.address}</p>
        {lines === undefined || lines.length === 0 ? null : (
          <p className="hg-doc-lines">{lines.join(' · ')}</p>
        )}
        {doc.letterheadNode === null ? null : (
          <div className="hg-doc-letterhead-node">{doc.letterheadNode}</div>
        )}
      </div>
      {doc.logoSrc === undefined ? (
        <DocumentSlot label={doc.logoLabel} />
      ) : (
        <img className="hg-doc-logo" src={doc.logoSrc} alt="" />
      )}
    </header>
  );
}

/** Who the document is for, and what it is. */
export function DocumentCover({ doc }: { doc: ResolvedDocument }) {
  return (
    <div className="hg-doc-cover">
      <div>
        <p className="hg-doc-overline">Prepared for</p>
        <p className="hg-doc-customer-name">{doc.customerName}</p>
        <p className="hg-doc-customer-meta">{doc.customerMeta}</p>
      </div>
      <div className="hg-doc-meta-block">
        <p className="hg-doc-title">{doc.docTitle}</p>
        <p className="hg-doc-number">{doc.docNumber}</p>
        <p className="hg-doc-date">{doc.docDateText}</p>
      </div>
    </div>
  );
}

/** The line that runs along the bottom of every page (`M01-50`). */
export function DocumentFooter({ doc }: { doc: ResolvedDocument }) {
  return (
    <footer className="hg-doc-footer">
      <span className="hg-doc-tax">
        {doc.taxLabel} {doc.taxId}
      </span>
      {doc.letterhead?.footerNote === undefined ? null : (
        <span className="hg-doc-footer-note">{doc.letterhead.footerNote}</span>
      )}
      <span>{doc.phone}</span>
    </footer>
  );
}
