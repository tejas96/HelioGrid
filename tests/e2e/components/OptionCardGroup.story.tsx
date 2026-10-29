import type { TranslatedText } from '@heliogrid/contracts';
import { OptionCardGroup, type OptionCardItem } from '@heliogrid/ui';
import { useState } from 'react';

/** A multi-select group that keeps what was ticked, as a screen holding the picks does. */
export function MultipleStory({
  options,
  label,
  start,
}: {
  options: OptionCardItem[];
  label: TranslatedText;
  start: string[];
}) {
  const [picked, pick] = useState<readonly string[]>(start);
  return (
    <div>
      <OptionCardGroup
        mode="multiple"
        options={options}
        label={label}
        value={picked}
        onChange={pick}
      />
      <output data-testid="picked">{picked.join(',')}</output>
    </div>
  );
}
