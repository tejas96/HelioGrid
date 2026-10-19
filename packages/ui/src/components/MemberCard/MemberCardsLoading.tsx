import type { MemberCardsLoadingProps } from './MemberCard.types';

/** Three placeholders, each with its own bar widths (the stylesheet's), so they do not read as one shape. */
const PLACEHOLDERS = ['a', 'b', 'c'] as const;

/**
 * Three member cards' shapes — the face, the name and line, the roles and the act — while the read
 * is out, so nothing moves when it lands (`SCR-M01-12`, `m-loading`).
 */
export function MemberCardsLoading({ label }: MemberCardsLoadingProps) {
  return (
    <section className="hg-member-loading" role="status" aria-busy="true" aria-label={label}>
      {PLACEHOLDERS.map((card) => (
        <div key={card} className="hg-member-loading-card" data-card={card} aria-hidden="true">
          <div className="hg-member-loading-head">
            <span className="hg-member-loading-bar" data-part="face" />
            <div className="hg-member-loading-words">
              <span className="hg-member-loading-bar" data-part="name" />
              <span className="hg-member-loading-bar" data-part="line" />
            </div>
          </div>
          <span className="hg-member-loading-bar" data-part="roles" />
          <span className="hg-member-loading-bar" data-part="act" />
        </div>
      ))}
    </section>
  );
}
