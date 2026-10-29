import { useEffect, useState } from 'react';
import { DATE_SET_WIDE_AT } from './DateSet.logic';
import type { DateSetProps } from './DateSet.types';

/**
 * The set's own width, measured by each half its own way and handed to `measure`: wide until the
 * first measurement, and the answer published through `onFormChange` once there is one.
 */
export function useDateSetRoom(onFormChange: DateSetProps['onFormChange']): {
  wide: boolean;
  measure: (width: number) => void;
} {
  const [own, setOwn] = useState<number | null>(null);
  const wide = own === null || own >= DATE_SET_WIDE_AT;

  useEffect(() => {
    if (own !== null) {
      onFormChange?.({ stacked: !wide, width: own });
    }
  }, [wide, own, onFormChange]);

  return { wide, measure: setOwn };
}
