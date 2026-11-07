import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import { AmbientSky } from '../AmbientSky';
import { BrandBloom } from '../BrandBloom';
import { LottieMoment } from '../LottieMoment/LottieMoment';
import type { SuccessDwellProps } from './SuccessDwell.types';

interface WebSuccessDwellProps extends SuccessDwellProps {
  className?: string;
  style?: CSSProperties;
}

/** The beat after the code is accepted: the sun rising in the door's light, owning the whole page at both widths. */
export function SuccessDwell({ title, line, className, style }: WebSuccessDwellProps) {
  return (
    <main className={classNames('hg-success-dwell', className)} style={style}>
      <AmbientSky strength="door" />
      <BrandBloom placement="centre" />
      <LottieMoment name="sunrise" size={120} />
      <div className="hg-success-dwell-words">
        <Text variant="display">{title}</Text>
        <Text variant="body" color="secondary" align="center">
          {line}
        </Text>
      </div>
    </main>
  );
}
