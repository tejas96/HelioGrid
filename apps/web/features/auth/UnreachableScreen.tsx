'use client';
import { useSession } from '@heliogrid/data/react';
import { connectionWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { NoConnection } from '@heliogrid/ui';

/**
 * A boot check with no answer keeps the session and asks again (`M01-07`); it never opens the
 * door. Shown wherever the web waits on that check — the gated groups and the signup route.
 */
export function UnreachableScreen() {
  const { retryBoot } = useSession();
  const t = useTranslate();
  return <NoConnection {...connectionWords(t)} onRetry={retryBoot} />;
}
