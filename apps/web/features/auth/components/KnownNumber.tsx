import type { KnownAccount } from '@heliogrid/domain';
import { COMPANY_SIGNUP, explainerPagerWords, SIGN_IN, signupExplainers } from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  DoorFrame,
  DoorLanguage,
  Explainer,
  PhoneValue,
  Text,
  TintedBlock,
} from '@heliogrid/ui';

/**
 * A number that already has an account, answered after its code verified (`M01-08`, ruled at
 * `T-M01-036`): the finding, the rule in a sentence and the tinted block in the identity half
 * (`SCR-M01-02` decision 22), the number as a fact and both roads full-size in the task — a
 * steer, not a block. Off the flow, so it carries no step header.
 */
export function KnownNumber({
  known,
  onEnter,
  onLeave,
}: {
  known: KnownAccount;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const t = useTranslate();
  const language = <DoorLanguage {...useLanguageChoice()} />;
  return (
    <DoorFrame
      trailing={language}
      taskMeasure="steps"
      identity={
        <>
          <div className="hg-door-title">
            <div className="hg-door-title-row">
              <Text variant="h1">{t(COMPANY_SIGNUP.knownTitle)}</Text>
              <Explainer {...signupExplainers(t).oneNumberOneAccount} {...explainerPagerWords(t)} />
            </div>
            <Text variant="body-lg" color="secondary">
              {t(COMPANY_SIGNUP.knownIntro)}
            </Text>
          </div>
          <TintedBlock
            tone="info"
            title={t(COMPANY_SIGNUP.knownBlockTitle)}
            body={t(COMPANY_SIGNUP.knownBlockBody)}
            className="hg-signup-finding"
          />
        </>
      }
    >
      <div className="hg-signup-roads">
        <PhoneValue label={t(SIGN_IN.mobileNumber)} value={known.next.phoneE164} />
        <Button variant="primary" size="lg" fullWidth onClick={onEnter}>
          {t(COMPANY_SIGNUP.signInWithThisNumber)}
        </Button>
        <div className="hg-door-centred">
          <Button variant="ghost" size="md" onClick={onLeave}>
            {t(COMPANY_SIGNUP.useDifferentNumber)}
          </Button>
        </div>
      </div>
    </DoorFrame>
  );
}
