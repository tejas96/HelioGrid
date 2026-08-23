import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { FabProps } from './AppRail.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebFabProps extends FabProps {
  className?: string;
  style?: CSSProperties;
}

/** Raised near-black action button. Springs on press; 56px so gloves can hit it. */
export function Fab({ label = 'Add', icon, onClick, size = 56, className, style }: WebFabProps) {
  const fabStyle: StyleVars = { '--hg-fab-size': `${size}px`, ...style };
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={classNames('hg-fab', className)}
      style={fabStyle}
    >
      {icon ?? <PlusIcon />}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
      className="hg-fab-glyph"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
