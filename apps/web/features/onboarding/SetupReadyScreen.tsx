'use client';
import { useSetupReady } from '@heliogrid/data/react';
import { setupReadyWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { SetupReady } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { DOOR_PATH } from '../shell';

/**
 * *You're ready* on the web (`SCR-M01-06`, `M01-26`), drawn by the inside group's gate for an owner
 * whose company has not closed setup. Door one opens Leads, then records the step: the gate draws
 * the shell there once the answer lands. The demo door opens nothing until `T-M01-029`.
 */
export function SetupReadyScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const ready = useSetupReady();
  return (
    <SetupReady
      read={ready.company}
      words={setupReadyWords(t)}
      demo={ready.demo}
      leaving={ready.leaving}
      onStartWithLead={() => {
        router.push(DOOR_PATH.leads);
        void ready.startWithLead();
      }}
      onOpenDemo={() => undefined}
      onRetryDemo={ready.retryDemo}
      retrying={ready.retrying}
    />
  );
}
