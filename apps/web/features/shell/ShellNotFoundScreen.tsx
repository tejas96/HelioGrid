'use client';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { HOME_ROUTE } from '../auth';
import { EmptyShellPage } from './components/EmptyShellPage';

/**
 * A door this person's shell does not offer (`SCR-M01-01` `m-not-found`), inside the shell — the
 * shell is the frame, so only the heading and the way home (owner ruling, `T-M01-039` finding 9).
 */
export function ShellNotFoundScreen() {
  const t = useTranslate();
  const router = useRouter();
  return (
    <EmptyShellPage
      title={t(SHELL.notFound)}
      action={
        <Button variant="primary" size="lg" onClick={() => router.push(HOME_ROUTE)}>
          {t(SHELL.goToHome)}
        </Button>
      }
    />
  );
}
