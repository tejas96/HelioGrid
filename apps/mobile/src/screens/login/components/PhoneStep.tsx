import type { SignIn } from '@heliogrid/data/react';
import { SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, PhoneField, Text } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';
import { DoorFrame } from './DoorFrame';
import { LanguageControl } from './LanguageControl';

/** Frame 1 — the front door as it opens, and its two answers on the field (number not accepted, sending). */
export function PhoneStep({
  signIn,
  onCreateCompany,
}: {
  signIn: SignIn;
  onCreateCompany: () => void;
}) {
  const t = useTranslate();
  const { state, busy } = signIn;
  const problem = state.phoneProblem;
  return (
    <DoorFrame trailing={<LanguageControl />}>
      <View style={styles.titleBlock}>
        <Text variant="h2">{t(SIGN_IN.signIn)}</Text>
        <Text variant="body" color="secondary">
          {t(SIGN_IN.intro)}
        </Text>
      </View>
      <View style={styles.form}>
        <PhoneField
          label={t(SIGN_IN.mobileNumber)}
          value={state.phone}
          onChange={signIn.typePhone}
          disabled={busy}
          announceError
          error={
            problem === null
              ? undefined
              : t(SIGN_IN.digitsMismatch, { typed: problem.typed, needed: problem.needed })
          }
          helper={busy ? t(SIGN_IN.lockedWhileSending) : t(SIGN_IN.willSendBySms)}
        />
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          onClick={() => signIn.press('send')}
        >
          {busy ? t(SIGN_IN.sendingTheCode) : t(SIGN_IN.sendCode)}
        </Button>
      </View>
      <View style={styles.spacer} />
      <View style={styles.door}>
        <Text variant="body-sm" color="secondary">
          {t(SIGN_IN.newCompany)}
        </Text>
        <Button variant="ghost" size="md" onClick={onCreateCompany}>
          {t(SIGN_IN.createCompany)}
        </Button>
      </View>
    </DoorFrame>
  );
}
