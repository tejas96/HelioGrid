import type { SignIn } from '@heliogrid/data/react';
import type { DoorRoad } from '@heliogrid/domain';
import { SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, PhoneField, Text } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { styles } from './door-styles';
import { InsetDoorFrame } from './InsetDoorFrame';
import { LanguageControl } from './LanguageControl';

/**
 * Frame 1 of either door — the number as it opens, and its two answers on the field (number not
 * accepted, sending). The two doors share the field and the primary and differ in their words:
 * the title, the intro, an optional note under the primary, and the road at the foot
 * (`SCR-M01-02`). `lead` is the signup's step header, absent on the front door.
 */
export function PhoneStep({
  signIn,
  lead,
  title,
  intro,
  note,
  road,
}: {
  signIn: SignIn;
  lead?: ReactNode;
  title: string;
  intro: string;
  note?: string;
  road: DoorRoad;
}) {
  const t = useTranslate();
  const { state, busy } = signIn;
  const problem = state.phoneProblem;
  return (
    <InsetDoorFrame trailing={<LanguageControl />}>
      {lead}
      <View style={styles.titleBlock}>
        <Text variant="h2">{title}</Text>
        <Text variant="body" color="secondary">
          {intro}
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
      {note === undefined ? null : (
        <View style={styles.caption}>
          <Text variant="caption" color="secondary">
            {note}
          </Text>
        </View>
      )}
      <View style={styles.spacer} />
      <View style={styles.road}>
        <Text variant="body-sm" color="secondary">
          {road.question}
        </Text>
        <Button variant="ghost" size="md" onClick={road.onPress}>
          {road.label}
        </Button>
      </View>
    </InsetDoorFrame>
  );
}
