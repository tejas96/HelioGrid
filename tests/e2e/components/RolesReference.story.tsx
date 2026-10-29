import { type ReadKind, roleHolders, type UiLanguage } from '@heliogrid/domain';
import { createTranslator, rolesReferenceWords } from '@heliogrid/i18n';
import { RolesReference } from '@heliogrid/ui';
import { useState } from 'react';
import { readIn } from '../support/read';
import { BOARD_ROSTER } from './roles-reference-roster';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The Roles reference as a screen holds it: the board's roster, counted by domain and worded in
 * `reader`'s language. *Try again* is reported as `data-retried`, the way back as `data-back`.
 */
export function RolesReferenceAsRead({
  reader,
  counts = 'ready',
  title = 'page',
  fromAssign = false,
}: {
  reader: UiLanguage;
  counts?: ReadKind;
  title?: 'page' | 'bar';
  fromAssign?: boolean;
}) {
  const { t } = READERS[reader];
  const [retried, setRetried] = useState(false);
  const [back, setBack] = useState(false);
  const words = rolesReferenceWords(t, counts === 'ready' ? roleHolders(BOARD_ROSTER) : null);
  return (
    /* At most the shell's content column at 1536 — the rail and the settings side list beside it. */
    <div
      lang={reader}
      data-retried={retried}
      data-back={back}
      style={{ padding: 16, maxWidth: 1104 }}
    >
      <RolesReference
        words={words}
        read={readIn(counts, BOARD_ROSTER, () => setRetried(true))}
        title={title}
        back={fromAssign ? { label: words.backToAssign, onPress: () => setBack(true) } : null}
      />
    </div>
  );
}
