import type { TranslatedText } from '@heliogrid/contracts';
import { listOrdinal } from './DocumentPreview.logic';
import type { ResolvedDocument } from './document-model';

/**
 * The document's bands, in document order. Each band drawn is the REAL one — a tranche schedule
 * is the schedule, never `[description, amount]` line items pretending to be one.
 */

/** A band's micro-label — drawn only when the caller has a word for it. */
export function BandTitle({ title }: { title: TranslatedText | undefined }) {
  return title === undefined ? null : (
    <p className="hg-doc-overline" data-spaced="true">
      {title}
    </p>
  );
}

export function DocumentItemsBand({ doc }: { doc: ResolvedDocument }) {
  return (
    <div>
      <div className="hg-doc-rule" />
      <table className="hg-doc-table">
        <tbody>
          {doc.lineItems.map((item) => (
            <tr key={item.description}>
              <td className="hg-doc-cell">{item.description}</td>
              <td className="hg-doc-cell hg-doc-amount">{item.amountText}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="hg-doc-total-row">
        <span className="hg-doc-total-label">{doc.totalLabel}</span>
        <span className="hg-doc-total-value">{doc.totalText}</span>
      </div>
      {doc.subsidyNote === undefined ? null : <p className="hg-doc-subsidy">{doc.subsidyNote}</p>}
    </div>
  );
}

/** `SCR-M01-19`'s included-sections list: what the template prints, in order. */
export function DocumentSectionsBand({ doc }: { doc: ResolvedDocument }) {
  return (
    <div>
      <div className="hg-doc-rule" />
      <BandTitle title={doc.sectionsTitle} />
      <ol className="hg-doc-section-list">
        {doc.sections.map((section, index) => (
          <li className="hg-doc-section-item" key={section.label}>
            <span className="hg-doc-section-index">{listOrdinal(index)}</span>
            <span className="hg-doc-section-label">{section.label}</span>
            {section.meta === undefined ? null : (
              <span className="hg-doc-section-meta">{section.meta}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** `SCR-M01-20`'s tranche schedule, as the customer will see it. */
export function DocumentTranchesBand({ doc }: { doc: ResolvedDocument }) {
  return (
    <div>
      <div className="hg-doc-rule" />
      <BandTitle title={doc.tranchesTitle} />
      <table className="hg-doc-table" data-tight="true">
        <tbody>
          {doc.tranches.map((tranche, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a schedule is positional, and two tranches may share a name
            <tr key={index}>
              <td className="hg-doc-tranche-index">{listOrdinal(index)}</td>
              <td className="hg-doc-tranche-cell">
                <span className="hg-doc-tranche-label">{tranche.label}</span>
                {tranche.when === undefined ? null : (
                  <span className="hg-doc-tranche-when">{tranche.when}</span>
                )}
              </td>
              <td className="hg-doc-tranche-share">{tranche.share}</td>
              <td className="hg-doc-tranche-amount">{tranche.amountText}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
