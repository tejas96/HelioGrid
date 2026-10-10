import type { KnownAccount } from '@heliogrid/domain';
import { COMPANY_SIGNUP, explainerPagerWords, SIGN_IN, signupExplainers } from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import { Button, DoorLanguage, Explainer, PhoneValue, Text, TintedBlock } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles as door } from '../../shared/door-styles';
import { InsetDoorFrame } from '../../shared/InsetDoorFrame';
import { styles } from '../styles';

/**
 * A number that already has an account, answered after its code verified (`M01-08`, ruled at
 * `T-M01-036`): the finding, the rule in a sentence, the number as a fact, and both roads
 * full-size — a steer, not a block. Off the flow, so it carries no step header.
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
    <InsetDoorFrame trailing={language}>
      <View style={styles.offFlowTitle}>
        <View style={door.titleRow}>
          <Text variant="h2" style={door.titleText}>
            {t(COMPANY_SIGNUP.knownTitle)}
          </Text>
          <Explainer {...signupExplainers(t).oneNumberOneAccount} {...explainerPagerWords(t)} />
        </View>
        <Text variant="body" color="secondary">
          {t(COMPANY_SIGNUP.knownIntro)}
        </Text>
      </View>
      <TintedBlock
        tone="info"
        title={t(COMPANY_SIGNUP.knownBlockTitle)}
        body={t(COMPANY_SIGNUP.knownBlockBody)}
      />
      <View style={styles.roads}>
        <PhoneValue label={t(SIGN_IN.mobileNumber)} value={known.next.phoneE164} />
        <Button variant="primary" size="lg" fullWidth onClick={onEnter}>
          {t(COMPANY_SIGNUP.signInWithThisNumber)}
        </Button>
        <View style={door.centred}>
          <Button variant="ghost" size="md" onClick={onLeave}>
            {t(COMPANY_SIGNUP.useDifferentNumber)}
          </Button>
        </View>
      </View>
      <View style={door.spacer} />
    </InsetDoorFrame>
  );
}
