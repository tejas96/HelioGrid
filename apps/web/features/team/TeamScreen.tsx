'use client';
import { useSession, useShell, useTeam } from '@heliogrid/data/react';
import { opensSettingsRow, showsListHead, teamStatusFilterOf } from '@heliogrid/domain';
import { settingsRowName, TEAM, teamListWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  DATA_TABLE_STACK_BELOW,
  FilterChips,
  MemberList,
  SearchField,
  Text,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { useRef } from 'react';
import { TeamTable } from './components/TeamTable';

import './team.css';

/**
 * The Team page behind `More` on the web (`SCR-M01-12`): every person and open or run-out invite,
 * found by name and narrowed by status. Below the table's width it draws the phone's member cards;
 * at it, the quiet table with the head count. Only a person whose presets open the Team row reaches
 * it (`F7-48`). What is read is `useTeam`'s and every word `teamListWords`'; this composes. The
 * invite act and a row's open land with `T-M01-007` and `T-M01-013` (ruling D1 A).
 */
export function TeamScreen() {
  const { user } = useSession();
  if (!opensSettingsRow(user?.tenant?.roles ?? [], 'team')) notFound();
  return <TeamIn />;
}

function TeamIn() {
  const { t, locale } = useI18n();
  const { pack } = useFormat();
  const shell = useShell();
  const team = useTeam(locale);
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= DATA_TABLE_STACK_BELOW;
  const words = teamListWords(t, {
    pack,
    language: locale,
    now: Date.now(),
    company: shell.companyName ?? '',
    query: team.query,
    status: team.status,
  });
  const ready = team.load === 'ready';
  const head = useRef<HTMLDivElement>(null);
  /* *Clear search* and *Show all* leave with the empty state they sit in; the keyboard's place goes
     to the search field or the *All* chip, or it falls to the page's start. */
  const clearSearch = () => {
    team.find('');
    head.current?.querySelector('input')?.focus();
  };
  const showAll = () => {
    team.filter('all');
    head.current?.querySelector<HTMLElement>('[role="tab"]')?.focus();
  };

  return (
    <div className="hg-shell-page" ref={room}>
      <header className="hg-team-head">
        <Text as="h1" variant="h2">
          {settingsRowName(t, 'team')}
        </Text>
        {wide && ready ? (
          <Text variant="body-sm" color="secondary">
            {t(TEAM.headCount, { people: team.view.people, invites: team.view.invites })}
          </Text>
        ) : null}
      </header>
      {showsListHead(team.surface) ? (
        <div className="hg-team-list-head" data-wide={wide ? 'true' : undefined} ref={head}>
          <div className="hg-team-find">
            <SearchField
              value={team.query}
              onChange={team.find}
              onClear={team.query === '' ? undefined : () => team.find('')}
              placeholder={words.find}
              ariaLabel={words.find}
            />
          </div>
          <FilterChips
            label={words.statusFilter}
            scroll={!wide}
            value={team.status}
            onChange={(value) => {
              const chosen = teamStatusFilterOf(value);
              if (chosen !== null) team.filter(chosen);
            }}
            counts={ready ? team.view.counts : undefined}
            options={words.statusOptions}
          />
        </div>
      ) : null}
      <MemberList
        surface={team.surface}
        rows={team.view.rows}
        words={words}
        onRetry={team.retry}
        onClearSearch={clearSearch}
        onShowAll={showAll}
        records={wide ? <TeamTable rows={team.view.rows} words={words} /> : undefined}
        waiting={wide ? <TeamTable rows={[]} words={words} loading /> : undefined}
      />
    </div>
  );
}
