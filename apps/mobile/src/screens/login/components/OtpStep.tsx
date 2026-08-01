import {
  CALL_OFFER_AFTER_RESENDS,
  formatPhoneNsn,
  OTP_LENGTH,
  type OtpFailure,
} from '@heliogrid/domain';
import { theme } from '@heliogrid/tokens/theme';
import { Trans, useLingui } from '@lingui/react';
import { View } from 'react-native';
import { AppText, OtpInput, Spinner, TextLink } from '../../../ui';
import { styles } from '../styles';
import { CallOfferCard } from './CallOfferCard';
import { OtpErrorRow } from './OtpErrorRow';
import { H1, Small } from './Typography';

export function OtpStep({
  phone,
  otp,
  otpSession,
  verifying,
  otpFailure,
  sendFailed,
  secondsLeft,
  resendCount,
  callRequested,
  onOtpChange,
  onOtpComplete,
  onResend,
  onChangeNumber,
  onCallMe,
}: {
  phone: string;
  otp: string;
  otpSession: number;
  verifying: boolean;
  otpFailure: OtpFailure | null;
  sendFailed: boolean;
  secondsLeft: number;
  resendCount: number;
  callRequested: boolean;
  onOtpChange(v: string): void;
  onOtpComplete(code: string): void;
  onResend(): void;
  onChangeNumber(): void;
  onCallMe(): void;
}) {
  const { i18n } = useLingui();
  const secondary = theme.colors['text-secondary'];
  const phoneValue = (
    <AppText weight="500" color={theme.colors['text-primary']}>
      {formatPhoneNsn(phone)}
    </AppText>
  );

  return (
    <>
      <H1>
        <Trans id="Enter your code" />
      </H1>
      <AppText color={secondary} style={styles.lede}>
        <Trans
          id="Enter the 6-digit code sent to +91 {phoneFormatted}."
          values={{ phoneFormatted: phoneValue }}
        />
      </AppText>
      <TextLink onPress={onChangeNumber} style={styles.changeNumber}>
        <Trans id="Change number" />
      </TextLink>
      <OtpInput
        key={otpSession}
        length={OTP_LENGTH}
        value={otp}
        onChange={onOtpChange}
        onComplete={onOtpComplete}
        error={otpFailure === 'mismatch'}
        disabled={verifying}
        autoFocus
        label={i18n._('6-digit code')}
        style={styles.otp}
      />
      {verifying ? (
        <View style={styles.inlineRow}>
          <Spinner size="sm" />
        </View>
      ) : (
        <OtpErrorRow failure={otpFailure} sendFailed={false} />
      )}
      <View style={styles.resendRow}>
        {secondsLeft > 0 ? (
          <Small color={theme.colors['text-tertiary']}>
            <Trans
              id="Resend code in {time}"
              values={{
                time: (
                  <Small mono color={theme.colors['text-tertiary']}>
                    {`0:${String(secondsLeft).padStart(2, '0')}`}
                  </Small>
                ),
              }}
            />
          </Small>
        ) : (
          <TextLink onPress={onResend}>
            <Trans id="Resend code" />
          </TextLink>
        )}
      </View>
      <OtpErrorRow failure={null} sendFailed={sendFailed} />
      {resendCount >= CALL_OFFER_AFTER_RESENDS ? (
        <CallOfferCard requested={callRequested} phone={phone} onCallMe={onCallMe} />
      ) : null}
    </>
  );
}
