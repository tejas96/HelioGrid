import type { SignIn } from '@heliogrid/data/react';
import { OTP_LENGTH } from '@heliogrid/domain';
import { SIGN_IN, signInWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, OtpInput, PhoneValue, Text, useFormat } from '@heliogrid/ui';
import { DoorFrame } from './DoorFrame';
import { LanguageControl } from './LanguageControl';
import { TintedBlock } from './TintedBlock';

/**
 * The code family — one frame per outcome, drawn once (`SCR-M01-01`, the `d-code-family` frame).
 * The frame is domain's, the words i18n's; this draws them and raises the presses.
 */
export function CodeStep({ signIn }: { signIn: SignIn }) {
  const t = useTranslate();
  const { phone } = useFormat();
  const { state, frame, busy } = signIn;
  const { primary, resend } = frame;
  const words = signInWords(t, frame, {
    cooldownLeft: state.cooldownLeft,
    triesLeft: state.triesLeft,
    phoneShown: phone(state.phone),
  });
  return (
    <DoorFrame
      trailing={
        <>
          <Button variant="ghost" size="sm" onClick={() => signIn.press('change-number')}>
            {t(SIGN_IN.changeNumber)}
          </Button>
          <LanguageControl />
        </>
      }
      identity={
        <div className="hg-door-title">
          <Text variant="h1">{words.title}</Text>
          <PhoneValue label={words.sub} value={state.phone} />
        </div>
      }
    >
      {words.block === null ? null : <TintedBlock {...words.block} />}
      <OtpInput
        length={OTP_LENGTH}
        label={t(SIGN_IN.codeLabel, { n: OTP_LENGTH })}
        value={state.code}
        onChange={signIn.typeCode}
        disabled={!frame.codeEnabled || busy}
        helper={words.helper}
        error={words.codeError ?? undefined}
        autoFocus={frame.codeEnabled}
      />
      {primary === null ? null : (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          onClick={() => signIn.press(primary.press)}
        >
          {words.primary}
        </Button>
      )}
      {resend?.kind === 'live' ? (
        <div className="hg-door-centred">
          <Button variant="ghost" size="md" onClick={() => signIn.press(resend.press)}>
            {words.resend}
          </Button>
        </div>
      ) : null}
      {resend?.kind === 'wait' ? (
        <div className="hg-door-centred">
          <Button variant="ghost" size="md" fullWidth disabled disabledReason={words.wait ?? ''}>
            {t(SIGN_IN.resendCode)}
          </Button>
        </div>
      ) : null}
      {words.call === null ? null : (
        <div className="hg-door-call">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => signIn.press('choose-call')}
          >
            {words.call.label}
          </Button>
          <Text variant="caption" color="secondary">
            {words.call.note}
          </Text>
        </div>
      )}
      {words.foot === null ? null : (
        <Text variant="caption" color="secondary">
          {words.foot}
        </Text>
      )}
    </DoorFrame>
  );
}
