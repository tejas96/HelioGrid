import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { DerivationGroupProps } from './Derivation.types';
import { DerivationGroupContext, useDerivationGroup } from './DerivationGroup.context';
import { DerivationParts } from './DerivationParts';

interface WebDerivationGroupProps extends DerivationGroupProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * **What makes forty derivations on one BOM survivable.** Single-open by default (opening the
 * fortieth closes the thirty-ninth, so at most one panel exists at a time; `mode="many"` opts a
 * small set out of that, and neither mode is an `openAll`), and on paper it prints one numbered
 * appendix instead of forty interleaved panels — because dropping the explanations from print
 * would make the paper less honest than the screen.
 */
export function DerivationGroup({
  children,
  mode = 'single',
  printAs = 'appendix',
  appendixTitle = 'How these figures are worked out',
  className,
  style,
}: WebDerivationGroupProps) {
  const { context, entries } = useDerivationGroup(mode, printAs);

  return (
    <DerivationGroupContext.Provider value={context}>
      <div className={classNames('hg-derivation-group', className)} style={style}>
        {children}
      </div>
      {printAs === 'appendix' && entries.length > 0 ? (
        <section className="hg-derivation-appendix" data-print="print-only">
          <h3 className="hg-derivation-appendix-title">{appendixTitle}</h3>
          <ol className="hg-derivation-appendix-list">
            {entries.map((entry) => (
              <li className="hg-derivation-appendix-item" key={entry.id}>
                {entry.label === undefined ? null : (
                  <span className="hg-derivation-appendix-label">{entry.label}</span>
                )}
                <DerivationParts parts={entry.parts} size="xs" />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </DerivationGroupContext.Provider>
  );
}
