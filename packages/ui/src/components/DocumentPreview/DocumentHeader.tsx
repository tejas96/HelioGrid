import type { ResolvedDocument } from './document-model';

/** The labelled placeholder slot that stands in until a logo arrives — the specimen's only. */
export function DocumentSlot({ label }: { label: string }) {
  return (
    <div className="hg-doc-slot">
      <span className="hg-doc-slot-label">{label}</span>
    </div>
  );
}

/** The tax number as printed: its label in the document's face, the number in mono (`F7-09`). */
function TaxNumber({ doc }: { doc: ResolvedDocument }) {
  return (
    <>
      {doc.taxLabel} <span className="hg-doc-figure">{doc.taxId}</span>
    </>
  );
}

/**
 * The band prints the tax number ITSELF, from `taxId`, so its number can take the mono face;
 * `letterhead.lines` holds only what the company writes (phone, email, website), printed as typed.
 */
function BandLines({ doc }: { doc: ResolvedDocument }) {
  const lines = doc.letterhead?.lines ?? [];
  if (doc.taxId === '' && lines.length === 0) {
    return null;
  }
  return (
    <p className="hg-doc-lines">
      {doc.taxId === '' ? null : <TaxNumber doc={doc} />}
      {doc.taxId !== '' && lines.length > 0 ? ' · ' : null}
      {lines.join(' · ')}
    </p>
  );
}

/** A logo, the specimen's slot, or — on a real cover with none — nothing: the name stands alone. */
function BandMark({ doc }: { doc: ResolvedDocument }) {
  if (doc.logoSrc !== undefined) {
    return <img className="hg-doc-logo" src={doc.logoSrc} alt="" />;
  }
  return doc.sample ? <DocumentSlot label={doc.logoLabel} /> : null;
}

/**
 * The letterhead band. It takes the brand fill ONLY if something can be read on it; otherwise
 * the document keeps a white header and demotes the brand to a rule — the honest consequence,
 * previewed, because a preview that flatters a failing colour is worse than no preview.
 */
export function DocumentBandHeader({ doc }: { doc: ResolvedDocument }) {
  const tagline = doc.letterhead?.tagline;
  return (
    <header className="hg-doc-band" data-band-ok={doc.bandOk ? 'true' : 'false'}>
      <div className="hg-doc-band-words">
        {doc.companyName === '' ? null : <p className="hg-doc-company">{doc.companyName}</p>}
        {tagline === undefined || tagline === '' ? null : (
          <p className="hg-doc-tagline">{tagline}</p>
        )}
        {doc.address === '' ? null : <p className="hg-doc-address">{doc.address}</p>}
        <BandLines doc={doc} />
        {doc.letterheadNode === null ? null : (
          <div className="hg-doc-letterhead-node">{doc.letterheadNode}</div>
        )}
      </div>
      <BandMark doc={doc} />
    </header>
  );
}

/** Who the document is for, and what it is. A blank recipient line reads as a missing value. */
export function DocumentCover({ doc }: { doc: ResolvedDocument }) {
  const named = doc.customerName !== '';
  const titled = doc.docTitle !== '' || doc.docNumber !== '' || doc.docDateText !== '';
  if (!named && !titled) {
    return null;
  }
  return (
    <div className="hg-doc-cover">
      {named ? (
        <div>
          {doc.preparedForLabel === '' ? null : (
            <p className="hg-doc-overline">{doc.preparedForLabel}</p>
          )}
          <p className="hg-doc-customer-name">{doc.customerName}</p>
          {doc.customerMeta === '' ? null : (
            <p className="hg-doc-customer-meta">{doc.customerMeta}</p>
          )}
        </div>
      ) : (
        <div />
      )}
      {titled ? (
        <div className="hg-doc-meta-block">
          {doc.docTitle === '' ? null : <p className="hg-doc-title">{doc.docTitle}</p>}
          {doc.docNumber === '' ? null : <p className="hg-doc-number">{doc.docNumber}</p>}
          {doc.docDateText === '' ? null : <p className="hg-doc-date">{doc.docDateText}</p>}
        </div>
      ) : null}
    </div>
  );
}

/** The line that runs along the bottom of every page (`M01-50`); its figures in mono (`F7-09`). */
export function DocumentFooter({ doc }: { doc: ResolvedDocument }) {
  const footerNote = doc.letterhead?.footerNote;
  return (
    <footer className="hg-doc-footer">
      <span>{doc.taxId === '' ? null : <TaxNumber doc={doc} />}</span>
      {footerNote === undefined || footerNote === '' ? null : (
        <span className="hg-doc-footer-note">{footerNote}</span>
      )}
      <span className="hg-doc-figure">{doc.phone}</span>
    </footer>
  );
}
