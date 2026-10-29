import type { TranslatedText } from '@heliogrid/contracts';
import { Block } from '@heliogrid/ui';
import { useState } from 'react';

/** A block whose read failed: its *Try again* sends the read out again, so the retry leaves. */
export function RetriedBlockStory({
  loading,
  tryAgain,
}: {
  loading: TranslatedText;
  tryAgain: TranslatedText;
}) {
  const [retried, setRetried] = useState(false);
  return (
    <Block
      read={retried ? { kind: 'loading' } : { kind: 'failed', retry: () => setRetried(true) }}
      loadingLabel={loading}
      retryLabel={tryAgain}
    />
  );
}
