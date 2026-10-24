import { createTranslator, filterPanelWords, SHELL } from '@heliogrid/i18n';
import { type FilterDimension, FilterPanel, type FilterValue } from '@heliogrid/ui';
import { useState } from 'react';

const en = await createTranslator('en');

/**
 * The filter panel as a screen holds it: the value lives here, in the browser, and changes only
 * through `onChange` — a value handed to `mount` never changes. The words are functions the panel
 * calls while it renders, so they are bound here, never handed across from the test. What the
 * panel holds now is printed as JSON in `held`.
 */
export function HeldFilterPanel({
  dimensions,
  initial,
  resultNoun,
}: {
  dimensions: FilterDimension[];
  initial: FilterValue;
  resultNoun: string;
}) {
  const [value, setValue] = useState<FilterValue>(initial);
  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
      <FilterPanel
        open
        modal={false}
        closeLabel={en.t(SHELL.close)}
        words={filterPanelWords(en.t)}
        dimensions={dimensions}
        value={value}
        onChange={setValue}
        resultCount={2}
        resultNoun={resultNoun}
      />
      <output data-testid="held">{JSON.stringify(value)}</output>
    </div>
  );
}
