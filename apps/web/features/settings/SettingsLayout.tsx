'use client';
import { SettingsList } from '@heliogrid/ui';
import { useSelectedLayoutSegment } from 'next/navigation';
import type { ReactNode } from 'react';
import { useSettingsList } from './hooks/use-settings-list';
import './settings.css';

/**
 * Every settings page behind `More` at the shell's desktop width stands beside the person's settings
 * list — the `side` form, the page in view marked — so a person moves between settings pages
 * without a way back (`SCR-SHELL-01`, *More: the settings list*). The list page itself is the list;
 * a person whose list holds one row gets no side list; below the desktop width a page stands
 * alone, as the phone's do.
 */
export function SettingsLayout({ children }: { children: ReactNode }) {
  const { list, person, open, first, openedRow } = useSettingsList();
  const segment = useSelectedLayoutSegment();
  if (segment === null || first === null) return children;
  return (
    <div className="hg-settings-page">
      <div className="hg-settings-page-side">
        <SettingsList
          form="side"
          title={list.title}
          person={person}
          groups={list.groups}
          onOpen={open}
          current={openedRow(segment) ?? undefined}
        />
      </div>
      <div className="hg-settings-page-content">{children}</div>
    </div>
  );
}
