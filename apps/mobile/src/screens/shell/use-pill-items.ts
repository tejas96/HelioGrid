import type { Shell } from '@heliogrid/data/react';
import type { StandingDestination } from '@heliogrid/domain';
import { destinationLabel, verbLabel } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import type { BottomNavItem } from '@heliogrid/ui';
import { DESTINATION_GLYPH, ShellGlyph } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { createElement, type RefObject } from 'react';
import type { View } from 'react-native';
import { DESTINATION_ROUTE, VERB_ROUTE } from './doors';

const glyph = (destination: StandingDestination, filled: boolean) =>
  createElement(ShellGlyph, {
    name: DESTINATION_GLYPH[destination],
    filled,
    tone: filled ? 'inverse' : 'secondary',
  });

/**
 * The pill's items, in `SCR-SHELL-01`'s order: Home, the first list, the add action, the second
 * list, More — no action slot for a preset with no verb (`F7-48`). The slots follow the person and
 * the verb the home in force (`T-SHELL-011`); this only names, draws and wires them. `navigate`,
 * never `push`, so a second tap on the route already open does nothing.
 */
export function usePillItems(
  shell: Pick<Shell, 'destinations' | 'centreVerb'>,
  actionRef: RefObject<View | null>,
): BottomNavItem[] {
  const t = useTranslate();
  const navigation = useNavigation();
  if (shell.destinations === null) return [];
  const items: BottomNavItem[] = shell.destinations.map((destination) => ({
    key: destination,
    label: destinationLabel(t, destination),
    icon: glyph(destination, false),
    activeIcon: glyph(destination, true),
    onClick: () =>
      destination === 'home'
        ? navigation.navigate('Shell')
        : navigation.navigate(DESTINATION_ROUTE[destination]),
  }));
  const verb = shell.centreVerb;
  if (verb === null) return items;
  const action: BottomNavItem = {
    key: 'action',
    verb: true,
    label: verbLabel(t, verb),
    icon: createElement(ShellGlyph, { name: 'plus-circle' }),
    anchor: actionRef,
    onClick: () => navigation.navigate(VERB_ROUTE[verb]),
  };
  // After Home and the first list; with no list, between Home and More.
  const at = shell.destinations.length === 2 ? 1 : 2;
  return [...items.slice(0, at), action, ...items.slice(at)];
}
