import type { TranslatedText } from '@heliogrid/contracts';
import { createTranslator, FIRST_RUN_PROFILE } from '@heliogrid/i18n';
import { PhotoField } from '@heliogrid/ui';
import { useState } from 'react';

const en = await createTranslator('en');

/** `PhotoField` alone, for its own spec: each act glyph, the refusal, the drop. */
export function PhotoFieldAt({
  size,
  actIcon,
  error,
}: {
  size: 72 | 120;
  actIcon: 'camera' | 'upload' | 'retry';
  error?: TranslatedText;
}) {
  const [dropped, setDropped] = useState('');
  return (
    <div>
      <PhotoField
        label={en.t(FIRST_RUN_PROFILE.photoLabel)}
        name="Anjali Kulkarni"
        size={size}
        actIcon={actIcon}
        chooseLabel={en.t(FIRST_RUN_PROFILE.photoAdd)}
        onChoose={() => undefined}
        onDrop={size === 120 ? (file) => setDropped(file.name) : undefined}
        error={error}
        errorTitle={error === undefined ? undefined : en.t(FIRST_RUN_PROFILE.photoFailed)}
        helper={en.t(FIRST_RUN_PROFILE.photoOptional)}
      />
      <output data-testid="dropped">{dropped}</output>
    </div>
  );
}
