import type { MemberRowsLoadingProps } from './MemberCard.types';

/** Three placeholders, each with its own bar widths (the stylesheet's), so they do not read as one shape. */
const PLACEHOLDERS = ['a', 'b', 'c'] as const;

/**
 * Three team rows' shapes in the list's one card — the face, the name, the line and the roles —
 * while the read is out, so nothing moves when it lands (`SCR-M01-12`, `m-loading`).
 */
export function MemberRowsLoading({ label }: MemberRowsLoadingProps) {
  return (
    <section className="hg-member-loading" role="status" aria-busy="true" aria-label={label}>
      <div className="hg-member-loading-card" aria-hidden="true">
        {PLACEHOLDERS.map((row) => (
          <div key={row} className="hg-member-loading-row" data-row={row}>
            <span className="hg-member-loading-bar" data-part="face" />
            <div className="hg-member-loading-words">
              <span className="hg-member-loading-bar" data-part="name" />
              <span className="hg-member-loading-bar" data-part="line" />
              <span className="hg-member-loading-bar" data-part="roles" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
