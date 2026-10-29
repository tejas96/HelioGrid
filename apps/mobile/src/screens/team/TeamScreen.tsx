import { useTeamScreen } from '@heliogrid/data/react';
import {
  rolesRemovedToast,
  rolesUndoFailedToast,
  teamActWords,
  teamListWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type FocusHandle,
  InviteEditor,
  MemberAct,
  MemberList,
  MemberListHead,
  memberActOf,
  TeamConfirm,
  useFormat,
  useToasts,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { TeamAssignRoles } from './components/TeamAssignRoles';
import { InviteTeammate, useInviteActs, useTeamInvite } from './components/TeamInvite';
import { TeamToastHost } from './components/TeamToastHost';

/**
 * The Team page behind `More` on the phone (`SCR-M01-12`, the 375 frames): the settings page's bar
 * with its way back, the search and the Status chips held at the top, and one member card per
 * person and open or run-out invite. The settings row opens it once its presets allow (`F7-48`).
 * What it draws is `useTeamScreen`'s, the web's too, and every word `teamListWords`' and
 * `teamActWords`'; the phone's own parts are the sheet's way back, the toasts' inset and focus.
 * *Invite teammate* opens Invite Teammate as a sheet over the page (`SCR-M01-07`, `T-M01-007`); an
 * active person's card opens Assign Roles (`SCR-M01-13`).
 */
export function TeamScreen() {
  const drillDown = useSettingsDrillDown('team');
  const { t, locale } = useI18n();
  const { pack } = useFormat();
  const toasts = useToasts();
  const search = useRef<FocusHandle>(null);
  const allChip = useRef<FocusHandle>(null);
  /* The screen reader's place returns to the act that opened a confirm when it is cancelled. */
  const opener = useRef<FocusHandle>(null);
  const inviteActs = useInviteActs();
  /* Each note runs on an answer, after this render: it reads the words drawn below. */
  const screen = useTeamScreen(locale, pack, {
    onActNote: (note) => {
      const toast = actWords.toast(note);
      if (toast !== null) toasts.push(toast);
    },
    onLeftRow: () => search.current?.focus(),
    onRemoved: (removal, undo) => {
      const { undoLabel, ...toast } = rolesRemovedToast(t, removal);
      toasts.push({ ...toast, undo: { label: undoLabel, onUndo: undo, focusAfter: search } });
    },
    onUndoFailed: (refusal, removal) => {
      toasts.push(rolesUndoFailedToast(t, refusal, { ...removal, companyName: company }));
    },
    onInviteShut: inviteActs.giveBack,
  });
  const invite = useTeamInvite(screen.invite, inviteActs, toasts.push);
  const { team, acts, list, company } = screen;
  const words = teamListWords(t, {
    pack,
    language: locale,
    now: Date.now(),
    company,
    query: team.query,
    status: team.status,
  });
  const actWords = teamActWords(t, company);

  return (
    <ShellPage
      inView="more"
      drillDown={drillDown}
      lead={list?.surface === 'teaching' ? undefined : <InviteTeammate invite={invite} />}
      stickyHead={
        screen.showsHead ? (
          <MemberListHead
            query={team.query}
            onFind={team.find}
            status={team.status}
            onFilter={team.filter}
            counts={list?.view.counts}
            words={words}
            searchRef={search}
            chipsRef={allChip}
          />
        ) : undefined
      }
    >
      <MemberList
        read={team.read}
        words={words}
        focusAfter={search}
        teachingAction={<InviteTeammate invite={invite} first />}
        onClearSearch={() => {
          team.find('');
          search.current?.focus();
        }}
        onShowAll={() => {
          team.filter('all');
          allChip.current?.focus();
        }}
        openOf={screen.openOf}
        actOf={(row) => {
          const act = memberActOf(row, team.roster, actWords, acts.sending);
          return act === null ? null : (
            <MemberAct
              {...act}
              ref={acts.opener === row.id ? opener : undefined}
              size="md"
              fullWidth
              onPress={() => acts.start(row)}
            />
          );
        }}
      />
      <TeamConfirm
        words={actWords.confirm(acts.confirm)}
        busy={acts.busy}
        onGo={acts.go}
        onLeave={() => {
          acts.shut();
          opener.current?.focus();
        }}
      />
      <InviteEditor {...invite.editor} />
      <TeamAssignRoles editor={screen.roles} companyName={company} />
      <TeamToastHost toasts={toasts} focusAfter={search} />
    </ShellPage>
  );
}
