'use client';
import type { Shell } from '@heliogrid/data/react';
import { destinationLabel } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { DESTINATION_GLYPH, type RailItem, ShellGlyph } from '@heliogrid/ui';
import { usePathname } from 'next/navigation';
import { createElement } from 'react';
import { HOME_ROUTE } from '../../auth';
import { DOOR_PATH } from '../constants';

/**
 * The rail's items, in `SCR-SHELL-01`'s order — the person's standing destinations, the phone
 * pill's without its add action, which rides the home's head on the web — the one in view, read
 * from the address, and where a pressed one goes. The slots are `useShell()`'s; this only names,
 * draws and routes them.
 */
export function useRailItems(
  shell: Pick<Shell, 'destinations'>,
  goTo: (path: string) => void,
): { items: RailItem[]; inView: string | undefined; choose: (key: string) => void } {
  const t = useTranslate();
  const pathname = usePathname();
  const destinations = shell.destinations ?? [];
  const pathOf = new Map<string, string>(
    destinations.map((d) => [d, d === 'home' ? HOME_ROUTE : DOOR_PATH[d]]),
  );
  const items = destinations.map((destination) => ({
    key: destination,
    label: destinationLabel(t, destination),
    icon: createElement(ShellGlyph, { name: DESTINATION_GLYPH[destination], size: 'md' }),
    activeIcon: createElement(ShellGlyph, {
      name: DESTINATION_GLYPH[destination],
      size: 'md',
      filled: true,
    }),
  }));
  const inView = destinations.find((destination) => pathOf.get(destination) === pathname);
  const choose = (key: string) => {
    const path = pathOf.get(key);
    if (path !== undefined) goTo(path);
  };
  return { items, inView, choose };
}
