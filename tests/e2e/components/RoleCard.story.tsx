import { type RoleCardNames, type RolePreset, roleCard, type UiLanguage } from '@heliogrid/domain';
import { createTranslator, PROFILE_PREFERENCES, roleCardWords, SHELL } from '@heliogrid/i18n';
import { type RoleCardState, RoleCardSurface } from '@heliogrid/ui';
import { useEffect, useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The role card reopened from Profile & preferences, as the screen holds it: domain's card for
 * `roles`, the words in `reader`'s language over `names`. The frame reports *Try again* as
 * `data-retried`, which also brings the card back, and a close as `data-closed`.
 */
export function RoleCardAsHeld({
  reader,
  roles = ['sales_executive'],
  names,
  surface = 'ready',
}: {
  reader: UiLanguage;
  roles?: readonly RolePreset[];
  names: RoleCardNames;
  surface?: RoleCardState;
}) {
  const [open, setOpen] = useState(true);
  const [retried, setRetried] = useState(false);
  const [state, setState] = useState(surface);
  const { t } = READERS[reader];
  const words = roleCardWords(t, roleCard(roles), names);
  return (
    <div
      lang={reader}
      data-retried={retried}
      data-closed={!open}
      style={{ position: 'relative', minHeight: '100dvh' }}
    >
      <RoleCardSurface
        open={open}
        onClose={() => setOpen(false)}
        title={words.surfaceTitle}
        closeLabel={t(SHELL.close)}
        words={words}
        surface={state}
        onRetry={() => {
          setRetried(true);
          setState('ready');
        }}
      />
    </div>
  );
}

/**
 * The card opened from a row, under a host that draws again every 50 ms while it is open — as a
 * screen does when its reads land — with a new `onClose` each time.
 */
export function RoleCardOpenedFromARow({ names }: { names: RoleCardNames }) {
  const [open, setOpen] = useState(false);
  const [, setTicks] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTicks((count) => count + 1), 50);
    return () => clearInterval(timer);
  }, []);
  const { t } = READERS.en;
  const words = roleCardWords(t, roleCard(['sales_executive']), names);
  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
      <button type="button" onClick={() => setOpen(true)}>
        {t(PROFILE_PREFERENCES.yourRole)}
      </button>
      <RoleCardSurface
        open={open}
        onClose={() => setOpen(false)}
        title={words.surfaceTitle}
        closeLabel={t(SHELL.close)}
        words={words}
        surface="ready"
        onRetry={() => undefined}
      />
    </div>
  );
}
