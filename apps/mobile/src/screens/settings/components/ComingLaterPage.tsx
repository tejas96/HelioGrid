import type { SettingsRow } from '@heliogrid/domain';
import { isComingRow, onItsWayWords, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { EmptyState } from '@heliogrid/ui';
import type { ComponentProps } from 'react';
import { ComingPageBody } from '../../shell/components/ComingPageBody';
import { ShellPage } from '../../shell/components/ShellPage';

/**
 * A page behind `More` whose screen has not landed, under the bar its caller names. A row still to
 * come says what it will do (`OnItsWay`); any other says only that it arrives later.
 */
export function ComingLaterPage({
  row,
  drillDown,
}: {
  row: SettingsRow;
  drillDown: ComponentProps<typeof ShellPage>['drillDown'];
}) {
  const t = useTranslate();
  return (
    <ShellPage inView="more" drillDown={drillDown}>
      {isComingRow(row) ? (
        <ComingPageBody words={onItsWayWords(t, row)} />
      ) : (
        <EmptyState title={t(SHELL.comingLater)} />
      )}
    </ShellPage>
  );
}
