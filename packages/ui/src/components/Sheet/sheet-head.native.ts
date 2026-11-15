import type { ReactNode } from 'react';
import type { Animated, PanResponderInstance } from 'react-native';
import { sheetHeaderOf, sheetTucks } from './Sheet.logic';
import type { TuckedTitle } from './SheetHandle.native';
import type { SheetHeaderSlotProps } from './SheetHeader.native';

type Heading = Omit<SheetHeaderSlotProps, 'panHandlers' | 'onLift' | 'tuck'>;

interface HeadRoom {
  meta: ReactNode;
  bodyScrolls: boolean;
  pan: PanResponderInstance;
  tuck: Animated.Value;
}

interface SheetHead {
  /** The header has a row of its own, so the body starts under it with no top padding. */
  row: boolean;
  /** The header in its own row above the body; absent when it is not drawn or lies over the body. */
  ownRow?: SheetHeaderSlotProps;
  /** The header lying over the body's top, its title tucking into the handle's row on scroll. */
  lifted?: SheetHeaderSlotProps;
  tucked?: TuckedTitle;
}

/**
 * Where the phone sheet's header goes. The phone draws no ✕, so a header is drawn only for its
 * words; with a title over a scrolling body it lies over the body and tucks its title into the
 * handle's row (`sheetTucks`), and otherwise it keeps a row of its own.
 */
export function sheetHeadOf(heading: Heading, room: HeadRoom): SheetHead {
  const { handle, title, overline, subtitle, headerLook } = heading;
  const { drawn, row } = sheetHeaderOf(handle, false, [title, overline, subtitle]);
  const props = { ...heading, panHandlers: handle ? undefined : room.pan.panHandlers };
  const tucks = sheetTucks({
    handle,
    hasTitle: title !== undefined,
    headerLook,
    meta: room.meta,
    bodyScrolls: room.bodyScrolls,
  });
  if (tucks && title !== undefined) {
    return { row, lifted: props, tucked: { title, tuck: room.tuck } };
  }
  return { row, ownRow: drawn ? props : undefined };
}
