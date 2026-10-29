import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';
import type { RailItem } from './AppRail.types';

/** What a screen reader hears for an item: its whole sentence, count included, or its label alone. */
export function spokenItemName(item: RailItem): TranslatedText {
  return item.name ?? item.label;
}

/** The item in view shows its filled icon, where it has one. */
export function navItemIcon(item: RailItem, inView: boolean): ReactNode {
  return inView ? (item.activeIcon ?? item.icon) : item.icon;
}

/** An anchor a coach mark reads through a ref the item binds; a selector anchor binds none. */
export function isRefAnchor(anchor: CoachMarkAnchor | undefined): anchor is { current: unknown } {
  return anchor !== undefined && typeof anchor !== 'string' && 'current' in anchor;
}
