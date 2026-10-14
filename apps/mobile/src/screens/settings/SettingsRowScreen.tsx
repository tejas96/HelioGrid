import { useSession } from '@heliogrid/data/react';
import { opensSettingsRow, type SettingsRow, settingsRowOfSegment } from '@heliogrid/domain';
import { SHELL, settingsRowName } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { EmptyState } from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import type { ComponentType } from 'react';
import { CompanyProfileSettingsScreen } from '../company-profile';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';

type Props = StaticScreenProps<{ segment: string }>;

/** The settings screens that have landed; every other row still opens the placeholder below. */
const BUILT_ROW: Partial<Record<SettingsRow, ComponentType>> = {
  company_profile: CompanyProfileSettingsScreen,
};

/**
 * A settings row's screen — inside the same shell with `More` still in view, so no row is dead,
 * as the shell's doors are (`PlaceholderScreen`). A row whose screen has landed opens it, at the
 * same link (`heliogrid://more/<segment>`, `M01-61`); any other shows the placeholder. A link
 * reaches every row, so one this person's presets do not open says the page does not exist
 * (`F7-48`), as the web's does.
 */
export function SettingsRowScreen({ route }: Props) {
  const t = useTranslate();
  const { user } = useSession();
  const row = settingsRowOfSegment(route.params.segment);
  const opens = row !== null && opensSettingsRow(user?.tenant?.roles ?? [], row);
  const Built = row !== null && opens ? BUILT_ROW[row] : undefined;
  if (Built !== undefined) return <Built />;
  return (
    <ShellPage inView="more">
      {row !== null && opens ? (
        <EmptyState title={settingsRowName(t, row)} description={t(SHELL.comingLater)} />
      ) : (
        <ShellNotFoundState />
      )}
    </ShellPage>
  );
}
