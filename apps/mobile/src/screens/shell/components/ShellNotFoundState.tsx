import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, EmptyState } from '@heliogrid/ui';
import { tabRoute } from '../doors';
import { useOpenTab } from '../use-open-tab';

/** A page this person's shell does not offer (`F7-48`), inside the shell: the heading and the way home. */
export function ShellNotFoundState() {
  const t = useTranslate();
  const openTab = useOpenTab();
  return (
    <EmptyState
      title={t(SHELL.notFound)}
      action={
        <Button variant="primary" size="lg" onClick={() => openTab(tabRoute.home)}>
          {t(SHELL.goToHome)}
        </Button>
      }
    />
  );
}
