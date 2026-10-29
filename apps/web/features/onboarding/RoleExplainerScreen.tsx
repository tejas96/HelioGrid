'use client';
import { useEndFirstRun, useRoleCard, useSession, useSessionPhase } from '@heliogrid/data/react';
import { roleCardWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { RoleExplainer } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HOME_ROUTE } from '../auth';

/**
 * The role card at first run on the web (`SCR-M01-10`, `M01-15`): the step after First-Run Profile,
 * or after a join that owed no name. A person signed out, with no company, or whose access was
 * removed has no role to read and goes home, whose gate sends them on. The act ends the steps after
 * the join and replaces this page, so back never returns here.
 */
export function RoleExplainerScreen() {
  const t = useTranslate();
  const router = useRouter();
  const phase = useSessionPhase();
  const { user, ended } = useSession();
  const role = useRoleCard();
  const endFirstRun = useEndFirstRun();
  const member = phase === 'signedIn' && user?.tenant != null && ended === null;

  useEffect(() => {
    if (phase !== 'booting' && !member) router.replace(HOME_ROUTE);
  }, [phase, member, router]);

  if (!member) return null;
  return (
    <RoleExplainer
      words={roleCardWords(t, role.card, role.facts)}
      read={role.read}
      namesPending={role.namesPending}
      onAct={() => {
        endFirstRun();
        router.replace(HOME_ROUTE);
      }}
    />
  );
}
