import { useSession } from '@heliogrid/data/react';
import { opensSettingsRow, settingsRowOfSegment } from '@heliogrid/domain';
import { SHELL, settingsRowName } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { EmptyState } from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';

type Props = StaticScreenProps<{ segment: string }>;

/**
 * A settings row's screen before it exists — inside the same shell with `More` still in view, so
 * no row is dead, as the shell's doors are (`PlaceholderScreen`). A link reaches every row, so one
 * this person's presets do not open says the page does not exist (`F7-48`), as the web's does. A
 * screen's own route replaces it.
 */
export function SettingsRowScreen({ route }: Props) {
  const t = useTranslate();
  const { user } = useSession();
  const row = settingsRowOfSegment(route.params.segment);
  const opens = row !== null && opensSettingsRow(user?.tenant?.roles ?? [], row);
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
