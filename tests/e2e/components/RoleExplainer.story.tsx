import {
  type ReadKind,
  type RoleCardNames,
  type RolePreset,
  roleCard,
  type UiLanguage,
} from '@heliogrid/domain';
import { createTranslator, roleCardWords } from '@heliogrid/i18n';
import { RoleExplainer } from '@heliogrid/ui';
import { useState } from 'react';
import { readIn } from '../support/read';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The role card at first run, as the screen holds it: domain's card for `roles`, the words in
 * `reader`'s language over `names`. The frame reports *Try again* as `data-retried`, which also
 * brings the card back, and the act as `data-acted`.
 */
export function RoleExplainerAsHeld({
  reader,
  roles = ['sales_executive'],
  names,
  surface = 'ready',
  pending = false,
}: {
  reader: UiLanguage;
  roles?: readonly RolePreset[];
  names: RoleCardNames;
  surface?: ReadKind;
  pending?: boolean;
}) {
  const [retried, setRetried] = useState(false);
  const [acted, setActed] = useState(false);
  const [state, setState] = useState(surface);
  const { t } = READERS[reader];
  return (
    <div lang={reader} data-retried={retried} data-acted={acted}>
      <RoleExplainer
        words={roleCardWords(t, roleCard(roles), names)}
        read={readIn(state, names, () => {
          setRetried(true);
          setState('ready');
        })}
        namesPending={pending}
        onAct={() => setActed(true)}
      />
    </div>
  );
}
