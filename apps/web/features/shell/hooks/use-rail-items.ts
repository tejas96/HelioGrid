'use client';
import type { SettingsScreen, Shell, Sidebar } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type StandingDestination } from '@heliogrid/domain';
import { destinationLabel, SIDEBAR, settingsWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { DESTINATION_GLYPH, type RailItem, ShellGlyph } from '@heliogrid/ui';
import { createElement } from 'react';
import { usePrefetch, useShownPath } from '../../../lib/instant-move';
import { HOME_ROUTE } from '../../auth';
import { DOOR_PATH, settingsRowPath } from '../constants';

/** The sidebar's own key for the settings list at its foot: no destination or row is named so. */
const SETTINGS_KEY = 'settings';

interface RailItems {
  /** The phone pill's items — every standing destination, More last — and the one in view. */
  readonly pill: { items: RailItem[]; inView: string | undefined };
  /** The desktop sidebar: the work above, the settings list at the foot. */
  readonly rail: {
    items: RailItem[];
    footer: RailItem[];
    value: string | undefined;
  };
  /** Where a pressed item goes, pill or sidebar. */
  readonly choose: (key: string) => void;
}

/**
 * The shell's navigation, named, drawn and routed from `useShell()`'s slots: on the phone the pill
 * (`SCR-SHELL-01`'s order); on the desktop the sidebar: the work only, and More as *Settings* at its
 * foot, whose pages carry their own side list. A list whose module has not landed carries *Soon*.
 */
export function useRailItems(
  shell: Pick<Shell, 'destinations'>,
  sidebar: Pick<Sidebar, 'soon'>,
  settings: Pick<SettingsScreen, 'firstBeside'>,
  goTo: (path: string) => void,
): RailItems {
  const t = useTranslate();
  // A press lights its item at once; the page it opens is loaded before the press.
  const pathname = useShownPath();
  const destinations = shell.destinations ?? [];
  const pathOf = new Map<string, string>(
    destinations.map((d) => [d, d === 'home' ? HOME_ROUTE : DOOR_PATH[d]]),
  );
  pathOf.set(SETTINGS_KEY, DOOR_PATH.more);
  /* The sidebar is the desktop's, where `/more` only sends a person on to the first settings page
     beside the side list: *Settings* goes there itself, one move instead of two. */
  const settingsOpens =
    settings.firstBeside === null
      ? DOOR_PATH.more
      : settingsRowPath(SETTINGS_SEGMENT[settings.firstBeside]);
  usePrefetch([...pathOf.values(), settingsOpens]);
  const destinationItem = (destination: StandingDestination): RailItem => {
    const label = destinationLabel(t, destination);
    const soon = sidebar.soon(destination);
    return {
      key: destination,
      label,
      icon: createElement(ShellGlyph, { name: DESTINATION_GLYPH[destination], size: 'md' }),
      activeIcon: createElement(ShellGlyph, {
        name: DESTINATION_GLYPH[destination],
        size: 'md',
        filled: true,
      }),
      ...(soon ? { tag: t(SIDEBAR.soon), name: t(SIDEBAR.soonNamed, { label }) } : {}),
    };
  };
  const pillItems = destinations.map(destinationItem);
  const pillInView = destinations.find((destination) => under(pathname, pathOf.get(destination)));

  const settingsTitle = settingsWords(t).title;
  return {
    pill: { items: pillItems, inView: pillInView },
    rail: {
      items: destinations.filter((d) => d !== 'more').map(destinationItem),
      footer: [
        {
          key: SETTINGS_KEY,
          label: settingsTitle,
          icon: createElement(ShellGlyph, { name: 'cog', size: 'md' }),
          onClick: () => goTo(settingsOpens),
        },
      ],
      value: sidebarValue(pathname, pathOf, destinations),
    },
    choose: (key) => {
      const path = pathOf.get(key);
      if (path !== undefined) goTo(path);
    },
  };
}

/** A place is in view on its own page and on every page under it, never on a sibling that merely starts with its word. */
function under(pathname: string, path: string | undefined): boolean {
  return path !== undefined && (pathname === path || pathname.startsWith(`${path}/`));
}

/** The sidebar's item in view: *Settings* on `/more` and every page under it, else the work there. */
function sidebarValue(
  pathname: string,
  pathOf: ReadonlyMap<string, string>,
  destinations: readonly StandingDestination[],
): string | undefined {
  if (under(pathname, pathOf.get(SETTINGS_KEY))) return SETTINGS_KEY;
  return destinations.find((destination) => under(pathname, pathOf.get(destination)));
}
