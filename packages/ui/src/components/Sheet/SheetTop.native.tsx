import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { PanResponderInstance } from 'react-native';
import type { SheetDensity } from './Sheet.types';
import { SheetHandle, type TuckedTitle } from './SheetHandle.native';
import { SheetHeaderSlot, type SheetHeaderSlotProps } from './SheetHeader.native';
import { SheetMeta } from './SheetMeta.native';

interface SheetTopProps {
  handle: boolean;
  pan: PanResponderInstance;
  closeLabel: TranslatedText;
  /** The close a screen reader finds on the handle; absent for a sheet that must be answered. */
  onClose?: () => void;
  /** The header in its own row; absent when it has nothing to show or lies over the body. */
  header?: SheetHeaderSlotProps;
  /** Set when the title tucks into the handle's row as the body scrolls. */
  tucked?: TuckedTitle;
  hasHeaderRow: boolean;
  meta: ReactNode;
  density: SheetDensity;
}

/** What stays above the body: the handle, the header's own row and the meta row. */
export function SheetTop({
  handle,
  pan,
  closeLabel,
  onClose,
  header,
  tucked,
  hasHeaderRow,
  meta,
  density,
}: SheetTopProps) {
  return (
    <>
      {handle ? (
        <SheetHandle
          hasHeader={hasHeaderRow}
          pan={pan}
          closeLabel={closeLabel}
          onClose={onClose}
          tucked={tucked}
        />
      ) : null}
      {header === undefined ? null : <SheetHeaderSlot {...header} />}
      <SheetMeta meta={meta} density={density} />
    </>
  );
}
