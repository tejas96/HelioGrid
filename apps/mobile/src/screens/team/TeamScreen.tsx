import { useShell, useTeam, useTeamActs } from '@heliogrid/data/react';
import { noteLeavesRow, showsListHead } from '@heliogrid/domain';
import { teamActWords, teamListWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  type FocusHandle,
  InviteEditor,
  MemberAct,
  MemberList,
  MemberListHead,
  memberActOf,
  TeamConfirm,
  ToastHost,
  useFormat,
  useToasts,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { underPill } from '../shell/styles';
import { InviteTeammate, useTeamInvite } from './components/TeamInvite';

/**
 * The Team page behind `More` on the phone (`SCR-M01-12`, the 375 frames): the settings page's bar
 * with its way back, the search and the Status chips held at the top, and one member card per
 * person and open or run-out invite. The settings row opens it once its presets allow (`F7-48`).
 * What is read is `useTeam`'s, what each act does `useTeamActs`', and every word `teamListWords`'
 * and `teamActWords`'; this composes. *Invite teammate* opens Invite Teammate as a sheet over the
 * page (`SCR-M01-07`, `T-M01-007`); a row's open lands with `T-M01-013`.
 */
export function TeamScreen() {
  const drillDown = useSettingsDrillDown('team');
  const { t, locale } = useI18n();
  const { pack } = useFormat();
  const shell = useShell();
  const team = useTeam(locale);
  const words = teamListWords(t, {
    pack,
    language: locale,
    now: Date.now(),
    company: shell.companyName ?? '',
    query: team.query,
    status: team.status,
  });
  const actWords = teamActWords(t, shell.companyName ?? '');
  const toasts = useToasts();
  const insets = useSafeAreaInsets();
  const search = useRef<FocusHandle>(null);
  const allChip = useRef<FocusHandle>(null);
  /* The screen reader's place returns to the act that opened a confirm when it is cancelled. */
  const opener = useRef<FocusHandle>(null);
  const acts = useTeamActs(team, (note) => {
    const toast = actWords.toast(note);
    if (toast !== null) toasts.push(toast);
    if (noteLeavesRow(note)) search.current?.focus();
  });

  const invite = useTeamInvite(() => team.reread(), toasts.push);

  return (
    <ShellPage
      inView="more"
      drillDown={drillDown}
      lead={team.surface === 'teaching' ? undefined : <InviteTeammate invite={invite} />}
      stickyHead={
        showsListHead(team.surface) ? (
          <MemberListHead
            query={team.query}
            onFind={team.find}
            status={team.status}
            onFilter={team.filter}
            counts={team.load === 'ready' ? team.view.counts : undefined}
            words={words}
            searchRef={search}
            chipsRef={allChip}
          />
        ) : undefined
      }
    >
      <MemberList
        surface={team.surface}
        rows={team.view.rows}
        words={words}
        onRetry={team.retry}
        onClearSearch={() => {
          team.find('');
          search.current?.focus();
        }}
        onShowAll={() => {
          team.filter('all');
          allChip.current?.focus();
        }}
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
      {/* Above the pill, which stands on the device's home-bar inset — the package reads no inset. */}
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        offset={underPill(insets.bottom) + theme.spacing['sp-6']}
      />
    </ShellPage>
  );
}
