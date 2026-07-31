import { theme } from '@heliogrid/tokens/theme';
import { useLingui } from '@lingui/react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineBanner, Wordmark } from '../../ui';
import { BloomBackdrop, DoneStep, OtpStep, PhoneStep, StepRise } from './components';
import { useLogin } from './hooks/use-login';
import { useReduceMotion } from './hooks/use-reduce-motion';
import { styles } from './styles';

/**
 * Login — phone → OTP → done. Composition only: all state and flow logic live in useLogin
 * (./hooks/use-login), all markup lives in ./components. No signup on RN (module
 * ruling 1): the footer is the invite-link placeholder.
 */
export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const { i18n } = useLingui();
  const insets = useSafeAreaInsets();
  const vm = useLogin(onSignedIn);
  const reduceMotion = useReduceMotion();

  return (
    <View style={styles.root}>
      <BloomBackdrop reduceMotion={reduceMotion} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroller,
            {
              paddingTop: insets.top + theme.spacing['sp-6'],
              paddingBottom: insets.bottom + theme.spacing['sp-6'],
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.column}>
            <Wordmark style={styles.wordmark} />
            {vm.offline ? (
              <OfflineBanner
                message={i18n._("You're offline — check your connection and try again.")}
                style={styles.offline}
              />
            ) : null}
            <StepRise key={vm.step} reduceMotion={reduceMotion}>
              {vm.step === 'phone' ? (
                <PhoneStep
                  phone={vm.phone}
                  sending={vm.sending}
                  sendFailed={vm.sendFailed}
                  canSubmit={vm.canSubmitPhone}
                  onChange={vm.onPhoneChange}
                  onSubmit={vm.onSubmitPhone}
                  onOpenInvite={vm.onOpenInvite}
                />
              ) : vm.step === 'otp' ? (
                <OtpStep
                  phone={vm.phone}
                  otp={vm.otp}
                  otpSession={vm.otpSession}
                  verifying={vm.verifying}
                  otpFailure={vm.otpFailure}
                  sendFailed={vm.sendFailed}
                  secondsLeft={vm.secondsLeft}
                  resendCount={vm.resendCount}
                  callRequested={vm.callRequested}
                  onOtpChange={vm.onOtpChange}
                  onOtpComplete={vm.onOtpComplete}
                  onResend={vm.onResend}
                  onChangeNumber={vm.onChangeNumber}
                  onCallMe={vm.onCallMe}
                />
              ) : (
                <DoneStep />
              )}
            </StepRise>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
