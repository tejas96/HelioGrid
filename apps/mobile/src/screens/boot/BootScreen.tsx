import { useSession } from '@heliogrid/data/react';
import { connectionWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { NoConnection } from '@heliogrid/ui';
import { PlaceholderScaffold } from '../shared/PlaceholderScaffold';

/**
 * While the session resolves. A boot check with no answer keeps the session and asks again
 * (`M01-07`); otherwise a placeholder — replaced when the real Boot screen is designed.
 */
export function BootScreen() {
  const { unreachable, retryBoot } = useSession();
  const t = useTranslate();
  if (unreachable) return <NoConnection {...connectionWords(t)} onRetry={retryBoot} />;
  return <PlaceholderScaffold name="Boot" />;
}
