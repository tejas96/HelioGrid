import type { SignIn } from '@heliogrid/data/react';
import { OTP_LENGTH } from '@heliogrid/domain';
import { SIGN_IN, type SignInLabels, signInWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, OtpInput, Text, TintedBlock } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { CodeGoogle } from './CodeGoogle';
import { CodeTitle } from './CodeTitle';
import { styles } from './door-styles';
import { InsetDoorFrame } from './InsetDoorFrame';

/**
 * The code family — one frame per outcome, drawn once (`SCR-M01-01`, the `m-*` code states) and
 * shared by both doors (`SCR-M01-02`: "the same component and the same words"). The frame is
 * domain's, the words i18n's; this draws them and raises the presses. Signup passes its step
 * header as `lead`, the one label it says differently, and the note its frame always carries.
 */
export function CodeStep({
  signIn,
  lead,
  labels,
  note,
}: {
  signIn: SignIn;
  lead?: ReactNode;
  labels?: SignInLabels;
  note?: string;
}) {
  const t = useTranslate();
  const { state, frame, busy } = signIn;
  const { primary, resend } = frame;
  const words = signInWords(
    t,
    frame,
    { cooldownLeft: state.cooldownLeft, triesLeft: state.triesLeft },
    labels,
  );
  return (
    <InsetDoorFrame
      trailing={
        <Button variant="ghost" size="sm" onClick={() => signIn.press('change-number')}>
          {t(SIGN_IN.changeNumber)}
        </Button>
      }
    >
      {lead}
      <View style={lead === undefined ? styles.codeColumn : styles.codeColumnAfterLead}>
        <CodeTitle words={words} phone={state.phone} />
        {words.block === null ? null : <TintedBlock {...words.block} announce="alert" />}
        {frame.code === 'absent' ? null : (
          <OtpInput
            length={OTP_LENGTH}
            label={t(SIGN_IN.codeLabel, { n: OTP_LENGTH })}
            value={state.code}
            onChange={signIn.typeCode}
            disabled={frame.code === 'closed'}
            readOnly={frame.code === 'read-only'}
            busy={busy}
            error={words.codeError ?? undefined}
            autoFocus={frame.code === 'open'}
          />
        )}
        {primary === null || words.primary === null ? null : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={busy}
            spokenName={words.primaryAria ?? undefined}
            onClick={() => signIn.press(primary.press)}
          >
            {words.primary}
          </Button>
        )}
        {resend?.kind === 'live' && words.resend !== null ? (
          <View style={styles.centred}>
            <Button variant="ghost" size="md" onClick={() => signIn.press(resend.press)}>
              {words.resend}
            </Button>
          </View>
        ) : null}
        {words.wait === null ? null : (
          <View style={styles.centred}>
            <Button variant="ghost" size="md" disabled spokenName={words.wait.spoken}>
              {words.wait.label}
            </Button>
          </View>
        )}
        {words.call === null ? null : (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => signIn.press('choose-call')}
          >
            {words.call}
          </Button>
        )}
        {words.google === null ? null : <CodeGoogle signIn={signIn} words={words.google} />}
        {words.foot === null ? null : (
          <Text variant="caption" color="secondary">
            {words.foot}
          </Text>
        )}
        {note === undefined ? null : (
          <Text variant="caption" color="secondary">
            {note}
          </Text>
        )}
      </View>
    </InsetDoorFrame>
  );
}
