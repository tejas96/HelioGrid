import type { DemoDoor, UiLanguage } from '@heliogrid/domain';
import { createTranslator, setupReadyWords } from '@heliogrid/i18n';
import { SetupReady } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * *You're ready* as its screen holds it, its words `setupReadyWords` in the reader's language —
 * the company line is a function, so the words cannot come through `mount`. Each act writes its
 * name to `pressed`, where a spec reads it.
 */
export function SetupReadyAsHeld({
  reader,
  demo,
  company,
  unreachable = false,
}: {
  reader: UiLanguage;
  demo: DemoDoor;
  company: string;
  unreachable?: boolean;
}) {
  const words = setupReadyWords(READERS[reader].t);
  const [pressed, setPressed] = useState('');
  /* *Try again* reads the company: here it answers at once. */
  const [wall, setWall] = useState(unreachable);
  return (
    <div lang={reader}>
      <SetupReady
        words={{ ...words, companyLine: words.companyLine(company) }}
        demo={demo}
        leaving={false}
        onStartWithLead={() => setPressed('lead')}
        onOpenDemo={() => setPressed('demo')}
        unreachable={wall}
        retrying={false}
        onTryAgain={() => {
          setPressed('try-again');
          setWall(false);
        }}
      />
      <output data-testid="pressed">{pressed}</output>
    </div>
  );
}
