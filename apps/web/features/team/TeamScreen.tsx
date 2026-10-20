'use client';
import { useSession, useShell, useTeam, useTeamActs } from '@heliogrid/data/react';
import { noteLeavesRow, opensSettingsRow, showsListHead, type TeamRow } from '@heliogrid/domain';
import { settingsRowName, TEAM, teamActWords, teamListWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  Button,
  DATA_TABLE_STACK_BELOW,
  type FocusHandle,
  InviteEditor,
  MemberAct,
  MemberList,
  MemberListHead,
  memberActOf,
  ShellGlyph,
  TeamConfirm,
  Text,
  ToastHost,
  useFormat,
  useOwnWidth,
  useToasts,
} from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { useTeamInvite } from './components/TeamInvite';
import { TeamTable } from './components/TeamTable';

import './team.css';

/**
 * The Team page behind `More` on the web (`SCR-M01-12`): every person and open or run-out invite,
 * found by name and narrowed by status. Below the table's width it draws the phone's member cards;
 * at it, the quiet table with the head count. Only a person whose presets open the Team row reaches
 * it (`F7-48`). What is read is `useTeam`'s, what each act does `useTeamActs`', and every word
 * `teamListWords`' and `teamActWords`'; this composes. *Invite teammate* opens Invite Teammate as
 * an editor over the page (`SCR-M01-07`, `T-M01-007`); a row's open lands with `T-M01-013`.
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
  const actWords = teamActWords(t, shell.companyName ?? '');
  const toasts = useToasts();
  const search = useRef<FocusHandle>(null);
  const allChip = useRef<FocusHandle>(null);
  /* The act that opened the confirm: a refused form redraws it off, so the overlay's own return of
     focus finds the old element gone. */
  const opener = useRef<FocusHandle>(null);
  const acts = useTeamActs(team, (note) => {
    const toast = actWords.toast(note);
    if (toast !== null) toasts.push(toast);
    if (noteLeavesRow(note)) search.current?.focus();
  });
  /* Stable: the overlay re-runs its focus effect whenever its close handler changes. */
  const { shut } = acts;
  const leave = useCallback(() => {
    shut();
    opener.current?.focus();
  }, [shut]);
  /* *Clear search* and *Show all* leave with the empty state they sit in; the keyboard's place goes
     to the search field or the *All* chip. */
  const clearSearch = () => {
    team.find('');
    search.current?.focus();
  };
  const showAll = () => {
    team.filter('all');
    allChip.current?.focus();
  };
  const invite = useTeamInvite(() => team.reread(), toasts.push);
  const inviteAct = (
    <Button
      ref={invite.act}
      variant="primary"
      size="lg"
      fullWidth={!wide}
      icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
      onClick={invite.open}
    >
      {invite.words.inviteTeammate}
    </Button>
  );
  /* The teaching state's own act under its words (`SCR-M01-12` m-teaching). */
  const inviteFirstAct = (
    <Button
      variant="primary"
      size="lg"
      icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
      onClick={invite.open}
    >
      {invite.words.inviteFirst}
    </Button>
  );
  const actOf = (row: TeamRow, size: 'md' | 'sm') => {
    const act = memberActOf(row, team.roster, actWords, acts.sending);
    return act === null ? null : (
      <MemberAct
        {...act}
        ref={acts.opener === row.id ? opener : undefined}
        size={size}
        fullWidth={size === 'md'}
        onPress={() => acts.start(row)}
      />
    );
  };

  return (
    <div className="hg-shell-page" ref={room}>
      <header className="hg-team-head">
        <div className="hg-team-title">
          <Text as="h1" variant="h2">
            {settingsRowName(t, 'team')}
          </Text>
          {wide && ready ? (
            <Text variant="body-sm" color="secondary">
              {t(TEAM.headCount, { people: team.view.people, invites: team.view.invites })}
            </Text>
          ) : null}
        </div>
        {wide ? inviteAct : null}
      </header>
      {!wide && team.surface !== 'teaching' ? (
        <div className="hg-team-invite">{inviteAct}</div>
      ) : null}
      {showsListHead(team.surface) ? (
        <MemberListHead
          query={team.query}
          onFind={team.find}
          status={team.status}
          onFilter={team.filter}
          counts={ready ? team.view.counts : undefined}
          words={words}
          wide={wide}
          searchRef={search}
          chipsRef={allChip}
        />
      ) : null}
      <MemberList
        surface={team.surface}
        rows={team.view.rows}
        words={words}
        teachingAction={inviteFirstAct}
        onRetry={team.retry}
        onClearSearch={clearSearch}
        onShowAll={showAll}
        actOf={(row) => actOf(row, 'md')}
        records={
          wide ? (
            <TeamTable
              rows={team.view.rows}
              words={words}
              actions={actWords.actions}
              actOf={(row) => actOf(row, 'sm')}
            />
          ) : undefined
        }
        waiting={
          wide ? (
            <TeamTable
              rows={[]}
              words={words}
              actions={actWords.actions}
              actOf={() => null}
              loading
            />
          ) : undefined
        }
      />
      <TeamConfirm
        words={actWords.confirm(acts.confirm)}
        busy={acts.busy}
        onGo={acts.go}
        onLeave={leave}
      />
      <InviteEditor {...invite.editor} />
      <ToastHost toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>
  );
}
