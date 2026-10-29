'use client';
import { useSession, useShell, useTeam, useTeamActs } from '@heliogrid/data/react';
import {
  mapRead,
  noteLeavesRow,
  OPENED_FROM_ASSIGN_ROLES,
  opensSettingsRow,
  SETTINGS_SEGMENT,
  showsListHead,
  type TeamRow,
} from '@heliogrid/domain';
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
import { notFound, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { settingsRowPath } from '../settings';
import { TeamAssignRoles, useTeamRoles } from './components/TeamAssignRoles';
import { useTeamInvite } from './components/TeamInvite';
import { TeamTable } from './components/TeamTable';

import './team.css';

/**
 * The Team page behind `More` on the web (`SCR-M01-12`): every person and open or run-out invite,
 * found by name and narrowed by status. Below the table's width it draws the phone's member cards;
 * at it, the quiet table with the head count. Only a person whose presets open the Team row reaches
 * it (`F7-48`). What is read is `useTeam`'s, what each act does `useTeamActs`', and every word
 * `teamListWords`' and `teamActWords`'; this composes. *Invite teammate* opens Invite Teammate as
 * an editor over the page (`SCR-M01-07`, `T-M01-007`); an active person's row opens Assign Roles
 * (`SCR-M01-13`), `useAssignRoles`' editor.
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
  const company = shell.companyName ?? '';
  const words = teamListWords(t, {
    pack,
    language: locale,
    now: Date.now(),
    company,
    query: team.query,
    status: team.status,
  });
  const list = team.read.kind === 'ready' ? team.read.value : null;
  const actWords = teamActWords(t, company);
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
  /* As a row act that leaves the row, an undo gives the keyboard to the search. */
  const roles = useTeamRoles(team, toasts, company, () => search.current?.focus());
  /* The sole-owner reason names the company, so no row opens before its name has arrived. */
  const openOf = shell.companyName === null ? undefined : roles.openerOf;
  const router = useRouter();
  /* Back from the Roles reference, Assign Roles opens again with the ticks it kept. */
  const { resume, stepAside } = roles;
  useEffect(() => resume(), [resume]);
  const openReference = () => {
    stepAside();
    router.push(`${settingsRowPath(SETTINGS_SEGMENT.roles)}?from=${OPENED_FROM_ASSIGN_ROLES}`);
  };
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

  /* One table for the wait and the rows: it draws its own loading. */
  const table = wide ? (
    <TeamTable
      read={mapRead(team.read, (shown) => shown.view.rows)}
      words={words}
      actions={actWords.actions}
      actOf={(row) => actOf(row, 'sm')}
      openOf={openOf}
    />
  ) : undefined;

  return (
    <div className="hg-shell-page" ref={room}>
      <header className="hg-team-head">
        <div className="hg-team-title">
          <Text as="h1" variant="h2">
            {settingsRowName(t, 'team')}
          </Text>
          {wide && list !== null ? (
            <Text variant="body-sm" color="secondary">
              {t(TEAM.headCount, { people: list.view.people, invites: list.view.invites })}
            </Text>
          ) : null}
        </div>
        {wide ? inviteAct : null}
      </header>
      {!wide && list?.surface !== 'teaching' ? (
        <div className="hg-team-invite">{inviteAct}</div>
      ) : null}
      {showsListHead(team.read) ? (
        <MemberListHead
          query={team.query}
          onFind={team.find}
          status={team.status}
          onFilter={team.filter}
          counts={list?.view.counts}
          words={words}
          wide={wide}
          searchRef={search}
          chipsRef={allChip}
        />
      ) : null}
      <MemberList
        read={team.read}
        words={words}
        teachingAction={inviteFirstAct}
        onClearSearch={clearSearch}
        onShowAll={showAll}
        actOf={(row) => actOf(row, 'md')}
        openOf={openOf}
        records={table}
        waiting={table}
      />
      <TeamConfirm
        words={actWords.confirm(acts.confirm)}
        busy={acts.busy}
        onGo={acts.go}
        onLeave={leave}
      />
      <InviteEditor {...invite.editor} />
      <TeamAssignRoles
        editor={roles}
        list={team.read}
        companyName={company}
        onReference={openReference}
      />
      <ToastHost toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>
  );
}
