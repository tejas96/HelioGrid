import { useSession } from '@heliogrid/data/react';
import { opensSettingsRow, type SettingsRow, settingsRowOfSegment } from '@heliogrid/domain';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { EmptyState } from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import type { ComponentType } from 'react';
import { BrandingSettingsScreen } from '../branding';
import { CatalogSettingsScreen } from '../catalog-settings';
import { CompanyProfileSettingsScreen } from '../company-profile';
import { ProfileScreen } from '../profile';
import { ProposalTemplateScreen } from '../proposal-template';
import { RolesReferenceScreen } from '../roles-reference';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';
import { TeamScreen } from '../team';
import { useSettingsDrillDown } from './hooks/use-settings-drill-down';

/** `from` names the page that opened this one, when its way back returns there (`?from=` in a link). */
type Props = StaticScreenProps<{ segment: string; from?: string }>;

/** The settings screens that have landed; every other row still opens the placeholder below. */
const BUILT_ROW: Partial<Record<SettingsRow, ComponentType<{ from: string | null }>>> = {
  profile: ProfileScreen,
  company_profile: CompanyProfileSettingsScreen,
  team: TeamScreen,
  roles: RolesReferenceScreen,
  catalog: CatalogSettingsScreen,
  branding: BrandingSettingsScreen,
  proposal_templates: ProposalTemplateScreen,
};

/**
 * A settings row's screen — inside the same shell with `More` still in view, so no row is dead,
 * as the shell's doors are (`PlaceholderScreen`). A row whose screen has landed opens it, at the
 * same link (`heliogrid://more/<segment>`, `M01-61`); any other shows the placeholder under the
 * settings page's own bar — its round way back, its title and the search — as every page opened
 * from the list draws it. A link reaches every row, so one this person's presets do not open says
 * the page does not exist (`F7-48`), as the web's does.
 */
export function SettingsRowScreen({ route }: Props) {
  const { user } = useSession();
  const row = settingsRowOfSegment(route.params.segment);
  const opens = row !== null && opensSettingsRow(user?.tenant?.roles ?? [], row);
  if (row === null || !opens) {
    return (
      <ShellPage inView="more">
        <ShellNotFoundState />
      </ShellPage>
    );
  }
  const Built = BUILT_ROW[row];
  return Built === undefined ? (
    <ComingLater row={row} />
  ) : (
    <Built from={route.params.from ?? null} />
  );
}

/** A row whose screen has not landed: the bar names the page, so the body says only that it is coming. */
function ComingLater({ row }: { row: SettingsRow }) {
  const t = useTranslate();
  const drillDown = useSettingsDrillDown(row);
  return (
    <ShellPage inView="more" drillDown={drillDown}>
      <EmptyState title={t(SHELL.comingLater)} />
    </ShellPage>
  );
}
