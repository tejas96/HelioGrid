import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Icon } from '../../primitives/Icon';
import type { DerivationProps } from './Derivation.types';
import { DERIVATION_KINDS } from './Derivation.types';
import { DerivationGroup } from './DerivationGroup';
import { DerivationParts } from './DerivationParts';
import { useDerivationPanel } from './useDerivationPanel';

interface WebDerivationProps extends DerivationProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * **The long-form explanation of a read-only computed number.**
 *
 * `Provenance` answers *whose authority and how far to trust* — one line, always visible, never
 * opened: a **label**. This answers *how the number was arrived at, what it assumes, where the
 * model stops, what it leaves out* — sentences, more than one: an **argument**. They are not
 * alternatives, which is why this component has **no `tier` prop**: passing one would let a caller
 * retire a persistent label behind a disclosure, exactly what `F8-07` forbids.
 *
 * The trigger is a real button, announced expandable, tappable at 44px, and its content lands
 * **in the flow beneath its own row** — never a floating layer, which is a tooltip's failure mode.
 */
export function Derivation({
  label,
  summary = 'How this is worked out',
  parts,
  variant = 'cell',
  open,
  defaultOpen = false,
  onToggle,
  id,
  className,
  style,
}: WebDerivationProps) {
  const panel = useDerivationPanel({ parts, label, summary, open, defaultOpen, onToggle, id });
  const big = variant === 'block';

  return (
    <div className={classNames('hg-derivation', className)} data-variant={variant} style={style}>
      <button
        type="button"
        className="hg-derivation-trigger"
        onClick={panel.toggle}
        aria-expanded={panel.isOpen}
        aria-controls={panel.panelId}
      >
        <span className="hg-derivation-chevron" data-open={panel.isOpen ? 'true' : undefined}>
          <Icon size="xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Icon>
        </span>
        {summary}
      </button>
      {panel.isOpen ? (
        <div
          id={panel.panelId}
          className="hg-derivation-panel"
          data-print={panel.screenOnly ? 'screen-only' : undefined}
        >
          {label !== undefined && big ? (
            <span className="hg-derivation-panel-label">{label}</span>
          ) : null}
          <DerivationParts parts={parts} size={big ? 'md' : 'sm'} />
        </div>
      ) : null}
    </div>
  );
}

Derivation.Group = DerivationGroup;
Derivation.kinds = DERIVATION_KINDS;

export { DerivationGroup };
