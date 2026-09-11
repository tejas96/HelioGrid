import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Icon } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { BrandBloom } from '../BrandBloom';
import type { SuccessDwellProps } from './SuccessDwell.types';

interface WebSuccessDwellProps extends SuccessDwellProps {
  className?: string;
  style?: CSSProperties;
}

/** The beat after the code is accepted: a centred mark that owns the whole page at both widths. */
export function SuccessDwell({ title, line, className, style }: WebSuccessDwellProps) {
  return (
    <main className={classNames('hg-success-dwell', className)} style={style}>
      <BrandBloom placement="centre" />
      <span className="hg-success-dwell-mark">
        <Icon size="lg">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </Icon>
      </span>
      <div className="hg-success-dwell-words">
        <Text variant="h2">{title}</Text>
        <Text variant="body" color="secondary" align="center">
          {line}
        </Text>
      </div>
    </main>
  );
}
