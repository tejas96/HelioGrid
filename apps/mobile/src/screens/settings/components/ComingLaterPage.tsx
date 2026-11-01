import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { EmptyState } from '@heliogrid/ui';
import type { ComponentProps } from 'react';
import { ShellPage } from '../../shell/components/ShellPage';

/** A page behind `More` whose screen has not landed, under the bar its caller names. */
export function ComingLaterPage({
  drillDown,
}: {
  drillDown: ComponentProps<typeof ShellPage>['drillDown'];
}) {
  const t = useTranslate();
  return (
    <ShellPage inView="more" drillDown={drillDown}>
      <EmptyState title={t(SHELL.comingLater)} />
    </ShellPage>
  );
}
