import {
  type TenantSegment,
  type UiLanguage,
  type WhatYouSellQuestion,
  whatYouSellUnanswered,
} from '@heliogrid/domain';
import { createTranslator, provenanceWords, setupWhatYouSellWords } from '@heliogrid/i18n';
import { ProvenanceWordsProvider, SetupWhatYouSell } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The what-you-sell step as a screen holds it: the two answers, the questions `Continue` was
 * refused at and the way pressed live here, in the browser, and the words are
 * `setupWhatYouSellWords`' in the reader's language. The words hold the ask's pager, a function the
 * component calls while it renders, so they cannot come through `mount`. `Continue` refuses as the
 * screen will: at what domain says is still owed.
 */
export function WhatYouSellStepAsHeld({
  reader,
  checking = false,
  failed = false,
  saving = false,
  segment: declaredSegment = null,
  size: declaredSize = null,
}: {
  reader: UiLanguage;
  checking?: boolean;
  failed?: boolean;
  saving?: boolean;
  segment?: TenantSegment | null;
  size?: number | null;
}) {
  const [segment, setSegment] = useState(declaredSegment);
  const [size, setSize] = useState(declaredSize);
  const [declarations, setDeclarations] = useState(0);
  const [refusedAt, setRefusedAt] = useState<readonly WhatYouSellQuestion[]>([]);
  const [refusals, setRefusals] = useState(0);
  const [pressed, setPressed] = useState('');
  const { t } = READERS[reader];
  const owed = whatYouSellUnanswered({ segment, typicalSystemKwp: size });
  return (
    <div lang={reader}>
      <ProvenanceWordsProvider value={provenanceWords(t)}>
        <SetupWhatYouSell
          words={setupWhatYouSellWords(t, {
            checking,
            failed,
            refused: refusedAt.filter((question) => owed.includes(question)),
          })}
          segment={segment}
          onChooseSegment={setSegment}
          typicalSystemKwp={size}
          onDeclareSize={(kwp) => {
            setSize(kwp);
            setDeclarations((count) => count + 1);
          }}
          saving={saving}
          refusals={refusals}
          onContinue={() => {
            if (owed.length === 0) {
              setPressed('continue');
              return;
            }
            setRefusedAt(owed);
            setRefusals((count) => count + 1);
          }}
          onFinishLater={() => setPressed('later')}
        />
      </ProvenanceWordsProvider>
      <output data-testid="segment">{segment ?? ''}</output>
      <output data-testid="size">{size === null ? '' : String(size)}</output>
      <output data-testid="declarations">{declarations}</output>
      <output data-testid="pressed">{pressed}</output>
    </div>
  );
}
