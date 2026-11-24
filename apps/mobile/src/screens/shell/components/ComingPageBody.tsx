import type { OnItsWayWords } from '@heliogrid/i18n';
import { Button, OnItsWay } from '@heliogrid/ui';
import { tabRoute } from '../doors';
import { useOpenTab } from '../use-open-tab';

/** A page whose module has not landed: what it will do, and the way home. */
export function ComingPageBody({ words }: { words: OnItsWayWords }) {
  const openTab = useOpenTab();
  return (
    <OnItsWay
      {...words}
      action={
        <Button variant="primary" size="lg" onClick={() => openTab(tabRoute.home)}>
          {words.goToHome}
        </Button>
      }
    />
  );
}
