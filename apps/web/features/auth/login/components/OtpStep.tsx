'use client';
import { Card, IconCircle, OtpInput, Spinner, TextLink } from '@heliogrid/ui';
import { Trans, useLingui } from '@lingui/react';
import { Phone } from 'lucide-react';
import type { OtpFailure } from '../types';
import { OtpErrorRow } from './OtpErrorRow';

interface OtpStepProps {
  phone: string;
  otp: string;
  otpEpoch: number;
  otpFailure: OtpFailure | null;
  verifying: boolean;
  sending: boolean;
  resendIn: number;
  showCallOffer: boolean;
  callRequested: boolean;
  onOtpChange(v: string): void;
  onOtpComplete(code: string): void;
  onResend(): void;
  onChangeNumber(): void;
  onCallMe(): void;
}

export function OtpStep({
  phone,
  otp,
  otpEpoch,
  otpFailure,
  verifying,
  sending,
  resendIn,
  showCallOffer,
  callRequested,
  onOtpChange,
  onOtpComplete,
  onResend,
  onChangeNumber,
  onCallMe,
}: OtpStepProps) {
  const { i18n } = useLingui();
  const phoneFormatted = `${phone.slice(0, 5)} ${phone.slice(5)}`;

  return (
    <div className="lg-step" aria-busy={verifying || undefined}>
      <h1 className="lg-h1">
        <Trans id="Enter your code" />
      </h1>
      <p className="lg-body">
        <Trans
          id="Enter the 6-digit code sent to +91 {phoneFormatted}."
          values={{ phoneFormatted: <span className="lg-phone">{phoneFormatted}</span> }}
        />
      </p>
      <div className="lg-change">
        <TextLink onClick={onChangeNumber}>
          <Trans id="Change number" />
        </TextLink>
      </div>
      <div className="lg-otp">
        <OtpInput
          key={otpEpoch}
          label={i18n._('6-digit code')}
          value={otp}
          onChange={onOtpChange}
          onComplete={onOtpComplete}
          error={otpFailure === 'mismatch'}
          disabled={verifying}
          autoFocus
        />
      </div>
      <OtpErrorRow failure={otpFailure} />
      <div className="lg-resend" aria-live="polite">
        {verifying || sending ? (
          <Spinner size="sm" />
        ) : resendIn === 0 ? (
          <TextLink onClick={onResend}>
            <Trans id="Resend code" />
          </TextLink>
        ) : (
          <span>
            <Trans
              id="Resend code in {time}"
              values={{
                time: <span className="lg-mono">{`0:${String(resendIn).padStart(2, '0')}`}</span>,
              }}
            />
          </span>
        )}
      </div>
      {showCallOffer ? (
        <div className="lg-call">
          <Card density="functional">
            <div className="lg-call-row">
              <IconCircle icon={<Phone size={20} strokeWidth={1.5} />} color="var(--accent)" />
              <div className="lg-call-body">
                {callRequested ? (
                  <p>
                    <Trans
                      id="Calling +91 {phoneFormatted} now with your code. Keep the phone nearby."
                      values={{
                        phoneFormatted: <span className="lg-phone">{phoneFormatted}</span>,
                      }}
                    />
                  </p>
                ) : (
                  <>
                    <p>
                      <Trans id="Still no code after two tries?" />
                    </p>
                    <TextLink onClick={onCallMe}>
                      <Trans id="Call me with the code instead" />
                    </TextLink>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
