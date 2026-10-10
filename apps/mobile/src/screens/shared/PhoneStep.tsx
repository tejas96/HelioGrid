import type { SignIn } from '@heliogrid/data/react';
import type { DoorRoad } from '@heliogrid/domain';
import {
  doorNoticeWords,
  type ExplainerWords,
  explainerPagerWords,
  phoneGoogleWords,
  SIGN_IN,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Explainer, PhoneField, Text, TextDivider, TintedBlock } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { styles } from './door-styles';
import { InsetDoorFrame } from './InsetDoorFrame';
import { LanguageControl } from './LanguageControl';

/**
 * Frame 1 of either door — the number as it opens, and its two answers on the field (number not
 * accepted, sending). The two doors share the field and the primary and differ in their words:
 * the title, the intro, the road at the foot, and — on the signup door only — the heading's
 * `Explainer` and the field's helper (`SCR-M01-02`). `lead` is the signup's step header, absent on the front door.
 */
export function PhoneStep({
  signIn,
  lead,
  title,
  intro,
  explainer,
  helper,
  road,
}: {
  signIn: SignIn;
  lead?: ReactNode;
  title: string;
  intro: string;
  explainer?: ExplainerWords;
  helper?: string;
  road: DoorRoad;
}) {
  const t = useTranslate();
  const { state, busy } = signIn;
  const problem = state.phoneProblem;
  const sending = state.pending?.kind === 'request';
  const google = signIn.google === null ? null : phoneGoogleWords(t, signIn.google);
  return (
    <InsetDoorFrame trailing={<LanguageControl />}>
      {lead}
      <View style={styles.spacerTop} />
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text variant="h2" style={styles.titleText}>
            {title}
          </Text>
          {explainer === undefined ? null : (
            <Explainer {...explainer} {...explainerPagerWords(t)} />
          )}
        </View>
        <Text variant="body" color="secondary">
          {intro}
        </Text>
      </View>
      <View style={styles.form}>
        {google?.failed ? <TintedBlock {...google.failed} announce="alert" /> : null}
        {signIn.notice === null ? null : <TintedBlock {...doorNoticeWords(t, signIn.notice)} />}
        <PhoneField
          label={t(SIGN_IN.mobileNumber)}
          value={state.phone}
          onChange={signIn.typePhone}
          readOnly={busy}
          announceError
          helper={helper}
          error={
            problem === null
              ? undefined
              : t(SIGN_IN.digitsMismatch, { typed: problem.typed, needed: problem.needed })
          }
        />
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={sending}
          disabled={busy && !sending}
          onClick={() => signIn.press('send')}
        >
          {sending ? t(SIGN_IN.sendingTheCode) : t(SIGN_IN.sendCode)}
        </Button>
        {google === null ? null : (
          <View style={styles.google}>
            <TextDivider label={google.or} />
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              loading={signIn.google?.busy}
              spokenName={google.aria}
              onClick={() => signIn.press('google')}
            >
              {google.label}
            </Button>
          </View>
        )}
      </View>
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
