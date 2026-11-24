import type { Shell } from '@heliogrid/data/react';
import type { StandingDestination } from '@heliogrid/domain';
import { destinationLabel, verbLabel } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import type { BottomNavItem } from '@heliogrid/ui';
import { DESTINATION_GLYPH, ShellGlyph } from '@heliogrid/ui';
import { createElement, type RefObject } from 'react';
import type { View } from 'react-native';
import type { PillDoor } from './use-open-tab';

const glyph = (destination: StandingDestination, inView: boolean) =>
  createElement(ShellGlyph, {
    name: DESTINATION_GLYPH[destination],
    tone: inView ? 'inverse' : 'secondary',
  });

/**
 * The pill's items, in `SCR-SHELL-01`'s order: Home, the first list, the action, the second
 * list, More — no action slot for a preset with no verb (`F7-48`). The slots follow the person and
 * the verb the home in force (`T-SHELL-011`); this only names, draws and wires them. A destination
 * opens its tab, so a second tap on the tab already open does nothing; the action runs the page's
 * own `act` where that page asked for it (quick add's page after a save), else opens its door.
 */
export function usePillItems(
  shell: Pick<Shell, 'destinations' | 'centreVerb'>,
  actionRef: RefObject<View | null>,
  act: (() => void) | undefined,
  open: (door: PillDoor) => void,
): BottomNavItem[] {
  const t = useTranslate();
  if (shell.destinations === null) return [];
  const items: BottomNavItem[] = shell.destinations.map((destination) => ({
    key: destination,
    label: destinationLabel(t, destination),
    icon: glyph(destination, false),
    activeIcon: glyph(destination, true),
    onClick: () => open(destination),
  }));
  const verb = shell.centreVerb;
  if (verb === null) return items;
  const action: BottomNavItem = {
    key: 'action',
    verb: true,
    label: verbLabel(t, verb),
    icon: createElement(ShellGlyph, { name: 'plus', tone: 'inverse' }),
    anchor: actionRef,
    onClick: act ?? (() => open(verb)),
  };
  // After Home and the first list; with no list, between Home and More.
  const at = shell.destinations.length === 2 ? 1 : 2;
  return [...items.slice(0, at), action, ...items.slice(at)];
}
