import { useShell, useTeam } from '@heliogrid/data/react';
import { showsListHead, teamStatusFilterOf } from '@heliogrid/domain';
import { teamListWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { FilterChips, MemberList, SearchField, useFormat } from '@heliogrid/ui';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';

/**
 * The Team page behind `More` on the phone (`SCR-M01-12`, the 375 frames): the settings page's bar
 * with its way back, the search and the Status chips held at the top, and one member card per
 * person and open or run-out invite. The settings row opens it once its presets allow (`F7-48`).
 * What is read is `useTeam`'s and every word `teamListWords`'; this composes. The invite act and a
 * row's open land with `T-M01-007` and `T-M01-013` (ruling D1 A).
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

  return (
    <ShellPage
      inView="more"
      drillDown={drillDown}
      stickyHead={
        showsListHead(team.surface) ? (
          <>
            <SearchField
              value={team.query}
              onChange={team.find}
              onClear={team.query === '' ? undefined : () => team.find('')}
              placeholder={words.find}
              ariaLabel={words.find}
            />
            <FilterChips
              label={words.statusFilter}
              scroll
              value={team.status}
              onChange={(value) => {
                const chosen = teamStatusFilterOf(value);
                if (chosen !== null) team.filter(chosen);
              }}
              counts={team.load === 'ready' ? team.view.counts : undefined}
              options={words.statusOptions}
            />
          </>
        ) : undefined
      }
    >
      <MemberList
        surface={team.surface}
        rows={team.view.rows}
        words={words}
        onRetry={team.retry}
        onClearSearch={() => team.find('')}
        onShowAll={() => team.filter('all')}
      />
    </ShellPage>
  );
}
