'use client';
import type { OnItsWayWords } from '@heliogrid/i18n';
import { Button, OnItsWay } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { HOME_ROUTE } from '../../auth';

/** A page whose module has not landed, inside the shell: what it will do, and the way home. */
export function ComingPage({ words }: { words: OnItsWayWords }) {
  const router = useRouter();
  return (
    <div className="hg-shell-page">
      <OnItsWay
        {...words}
        action={
          <Button variant="primary" size="lg" onClick={() => router.push(HOME_ROUTE)}>
            {words.goToHome}
          </Button>
        }
      />
    </div>
  );
}
