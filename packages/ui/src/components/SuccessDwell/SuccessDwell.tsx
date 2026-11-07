import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import { BrandBloom } from '../BrandBloom';
import { LottieMoment } from '../LottieMoment/LottieMoment';
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
      <LottieMoment name="success" size={96} />
      <div className="hg-success-dwell-words">
        <Text variant="display">{title}</Text>
        <Text variant="body" color="secondary" align="center">
          {line}
        </Text>
      </div>
    </main>
  );
}
