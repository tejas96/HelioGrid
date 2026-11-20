import { createTranslator, siteDetailsPageWords, studioCanvasWords } from '@heliogrid/i18n';
import { PageTrail } from '@heliogrid/ui';
import { useState } from 'react';

const en = await createTranslator('en');
const page = siteDetailsPageWords(en.t);

/** The name both places carry: a lead and its design, both named for the customer's house. */
const twinName = studioCanvasWords(en.t).designName('Weber house', 1);

/**
 * A started design's Site details trail, whose last two places share one name. The frame reports
 * which crumb opened as `data-act`.
 */
export function TrailWithTwinNames() {
  const [act, setAct] = useState('');
  return (
    <div data-act={act}>
      <PageTrail
        trail={[
          { label: twinName, onOpen: () => setAct('lead') },
          { label: twinName, onOpen: () => setAct('design') },
        ]}
        here={page.title}
        label={page.trail}
      />
    </div>
  );
}
