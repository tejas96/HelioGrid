import { type CSSProperties, Fragment, useMemo, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { type PrintScopeApi, PrintScopeContext } from '../../utils/print-scope';
import type { DisclosureSpec } from '../Disclosure';
import { renderDisclosure } from '../Disclosure';
import type { PrintScopeProps } from './PagedDocument.types';

interface WebPrintScopeProps extends PrintScopeProps {
  className?: string;
  style?: CSSProperties;
}

interface Registration {
  id: string;
  spec: DisclosureSpec;
}

/**
 * PrintScope — a region that saves but does not print (SCR-M06-13), or one that only prints.
 *
 * AND THE GUARD THAT MAKES THE SECOND DIRECTION UNDEFEATABLE. A `Disclosure` inside a screen-only
 * region registers itself here, and the scope renders it again in a print-only copy beside the
 * suppressed block — because `display:block !important` cannot beat an ancestor's `display:none`,
 * so the CSS declaration alone would have been a suppressible mandatory statement. The clone is
 * rendered with a NULL scope, or it would register itself and recurse.
 */
export function PrintScope({ only = 'screen', children, className, style }: WebPrintScopeProps) {
  const [regs, setRegs] = useState<Registration[]>([]);
  const api = useMemo<PrintScopeApi>(
    () => ({
      suppressed: only === 'screen',
      register: (id, spec) =>
        setRegs((r) => {
          const i = r.findIndex((x) => x.id === id);
          if (i < 0) return [...r, { id, spec }];
          const next = r.slice();
          next[i] = { id, spec };
          return next;
        }),
      unregister: (id) => setRegs((r) => r.filter((x) => x.id !== id)),
    }),
    [only],
  );
  const attr = only === 'screen' ? 'screen-only' : only === 'print' ? 'print-only' : undefined;
  return (
    <PrintScopeContext.Provider value={api}>
      <div data-print={attr} className={classNames('hg-print-scope', className)} style={style}>
        {children}
      </div>
      {only === 'screen' && regs.length > 0 && (
        <PrintScopeContext.Provider value={null}>
          <div data-print="print-only" className="hg-print-scope-hoist">
            {regs.map((r) => (
              <Fragment key={r.id}>{renderDisclosure(r.spec)}</Fragment>
            ))}
          </div>
        </PrintScopeContext.Provider>
      )}
    </PrintScopeContext.Provider>
  );
}
