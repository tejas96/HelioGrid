import { theme } from '@heliogrid/theme';
import { measureFocusedField } from '@heliogrid/ui';
import { type RefObject, useEffect, useRef } from 'react';
import { Keyboard, type ScrollView } from 'react-native';

/**
 * Room kept under a focused field: its hint or its error line, which the system's own scroll does
 * not count — it brings only the text box into view, so the field's well and the line under it
 * would stay under the keyboard or an act bar in the pill's place (`SCR-M01-18` AC-19).
 */
const ROOM_UNDER_FIELD = theme.spacing['sp-10'];

/**
 * When the keyboard shows, or the page's visible room changes while a field is focused (an act bar
 * rising in the pill's place on the first edit), scrolls the shell's page so the focused field and
 * the line under it sit fully in view. The room in view ends at the page's edge or the keyboard's
 * top, whichever is higher: Android shrinks the page for the keyboard less its navigation bar,
 * which the keyboard still covers. The field's place is read in the page's content, never from
 * the last scroll the page reported: that one is stale while the keyboard slides in. Hand it the
 * page's scroll and layout as the page reports them.
 */
export function useFocusedFieldInView(scroll: RefObject<ScrollView | null>) {
  const offset = useRef(0);
  const keyboardTop = useRef(Number.POSITIVE_INFINITY);
  const bringIntoView = useRef(() => {
    const page = scroll.current;
    const room = page?.getNativeScrollRef();
    if (page == null || room == null) return;
    measureFocusedField(room, (top, height) => {
      room.measureInWindow((_x, roomTop, _width, roomHeight) => {
        const inView = Math.min(roomHeight, keyboardTop.current - roomTop);
        const lowest = top + height + ROOM_UNDER_FIELD - inView;
        if (lowest > offset.current) page.scrollTo({ y: lowest, animated: true });
      });
    });
  }).current;
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      bringIntoView();
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = Number.POSITIVE_INFINITY;
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [bringIntoView]);
  return {
    onScroll: (y: number) => {
      offset.current = y;
    },
    onLayout: bringIntoView,
  };
}
