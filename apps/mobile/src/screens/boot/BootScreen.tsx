import { useSession } from '@heliogrid/data/react';
import { bootLabel, connectionWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { BootSplash, NoConnection } from '@heliogrid/ui';

/**
 * While the session resolves: the wordmark and the breathing sun (`BootSplash`). A boot check with
 * no answer keeps the session and asks again (`M01-07`).
 */
export function BootScreen() {
  const { unreachable, retryBoot } = useSession();
  const t = useTranslate();
  if (unreachable) return <NoConnection {...connectionWords(t)} onRetry={retryBoot} />;
  return <BootSplash label={bootLabel(t)} />;
}
