'use client';
import { BloomLayer, OfflineBanner, Wordmark } from '@heliogrid/ui';
import { useLingui } from '@lingui/react';
import { DoneStep, OtpStep, PhoneStep } from './components';
import { useLogin } from './hooks/use-login';
import './login.css';

/** Login — phone → OTP → done.
 *  S1: OTP login is sendOtp → verify (verify creates the session), never signIn. */
export function LoginScreen() {
  const { i18n } = useLingui();
  const vm = useLogin();

  return (
    <main className="lg-screen">
      <span className="lg-bloom-m">
        <BloomLayer size={520} />
      </span>
      <span className="lg-bloom-d">
        <BloomLayer size={860} />
      </span>
      <div className="lg-scroll">
        <div className="lg-col">
          {vm.online ? null : (
            <div className="lg-offline">
              <OfflineBanner
                message={i18n._("You're offline — check your connection and try again.")}
              />
            </div>
          )}
          <div className="lg-mark">
            <Wordmark />
          </div>

          {vm.step === 'phone' ? (
            <PhoneStep
              phone={vm.phone}
              sending={vm.sending}
              sendError={vm.sendError}
              online={vm.online}
              onPhoneChange={vm.onPhoneChange}
              onSubmitPhone={vm.onSubmitPhone}
            />
          ) : null}

          {vm.step === 'otp' ? (
            <OtpStep
              phone={vm.phone}
              otp={vm.otp}
              otpEpoch={vm.otpEpoch}
              otpFailure={vm.otpFailure}
              verifying={vm.verifying}
              sending={vm.sending}
              resendIn={vm.resendIn}
              showCallOffer={vm.showCallOffer}
              callRequested={vm.callRequested}
              onOtpChange={vm.onOtpChange}
              onOtpComplete={vm.onOtpComplete}
              onResend={vm.onResend}
              onChangeNumber={vm.onChangeNumber}
              onCallMe={vm.onCallMe}
            />
          ) : null}

          {vm.step === 'done' ? <DoneStep /> : null}
        </div>
      </div>
    </main>
  );
}
