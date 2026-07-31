import { COUNTRY_CALLING_CODE, OTP_LENGTH, PHONE_NSN_LENGTH } from '@heliogrid/contracts';
import type { LoginStep, OtpFailure } from '@heliogrid/domain';
import { theme } from '@heliogrid/tokens/theme';
import { Trans, useLingui } from '@lingui/react';
import { Check, CircleAlert, Phone } from 'lucide-react-native';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authClient } from '../../auth/client';
import {
  AppText,
  Button,
  Card,
  IconCircle,
  Input,
  OfflineBanner,
  OtpInput,
  Spinner,
  TextLink,
  Wordmark,
} from '../../ui';
import { BloomBackdrop, H1, Small, StepRise } from './components';
import { useReduceMotion } from './hooks';

/**
 * Login — phone → OTP → done (docs/modules/auth-tenancy/specs/login.md, RN variant of
 * the mobile LoginFlow). Better Auth phone-OTP sends/verifies; the session cookie then
 * flows through the keychain jar to the typed client. No signup on RN (module ruling 1):
 * the footer is the invite-link placeholder. Off-token mockup spacing is snapped to the
 * 4px scale per the spec's C3/C4 rulings.
 */

// ds-ref LoginFlow mobile geometry + flow timing (login.md §2/§5 component-spec constants).
const COL_MAX = 620;
const RESEND_SECONDS = 30;
const AUTO_VERIFY_DELAY_MS = 140;
const CALL_CARD_AFTER_RESENDS = 2;
// Q9: the spec leaves the done-step dwell unspecified — brief beat, then hand off.
const DONE_DWELL_MS = 900;

/** 5+5 grouping in every locale (digits never translate). */
const formatPhone = (p: string) => `${p.slice(0, 5)} ${p.slice(5)}`;

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const { i18n } = useLingui();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpFailure, setOtpFailure] = useState<OtpFailure | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendCount, setResendCount] = useState(0);
  const [callRequested, setCallRequested] = useState(false);
  // Remount key for OtpInput: entry + every resend clear the boxes AND refocus box 1.
  const [otpSession, setOtpSession] = useState(0);
  const reduceMotion = useReduceMotion();

  const stepRef = useRef(step);
  stepRef.current = step;
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendInFlight = useRef(false);
  const verifyInFlight = useRef(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 30s resend countdown — restarts on OTP entry and every resend; the cleanup covers
  // unmount and "Change number" (step leaves 'otp').
  // biome-ignore lint/correctness/useExhaustiveDependencies: otpSession is the deliberate restart trigger — every resend rewinds the countdown
  useEffect(() => {
    if (step !== 'otp') return;
    setSecondsLeft(RESEND_SECONDS);
    // Timestamp math, not tick decrement — RN suspends timers while backgrounded.
    const end = Date.now() + RESEND_SECONDS * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [step, otpSession]);

  useEffect(
    () => () => {
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    },
    [],
  );

  const sendCode = useCallback(
    async (kind: 'initial' | 'resend') => {
      if (sendInFlight.current) return; // rapid double-tap guard (ref: same-frame safe)
      sendInFlight.current = true;
      setSending(true);
      setSendFailed(false);
      setOffline(false);
      try {
        const { error } = await authClient.phoneNumber.sendOtp({
          phoneNumber: `${COUNTRY_CALLING_CODE}${phone}`,
        });
        if (error) {
          setSendFailed(true);
          return;
        }
        setOtp('');
        setOtpFailure(null);
        setOtpSession((k) => k + 1);
        if (kind === 'initial') {
          setResendCount(0);
          setCallRequested(false);
          setStep('otp');
        } else {
          setResendCount((c) => c + 1);
        }
      } catch {
        setOffline(true);
      } finally {
        sendInFlight.current = false;
        setSending(false);
      }
    },
    [phone],
  );

  const verify = useCallback(
    async (code: string) => {
      if (verifyInFlight.current) return;
      verifyInFlight.current = true;
      setVerifying(true);
      setOffline(false);
      try {
        const { error } = await authClient.phoneNumber.verify({
          phoneNumber: `${COUNTRY_CALLING_CODE}${phone}`,
          code,
        });
        if (stepRef.current !== 'otp') return; // user changed number while in flight
        if (error) {
          // 4xx = wrong/expired code (digits retained); 5xx/opaque = transport (web parity)
          setOtpFailure(error.status && error.status < 500 ? 'mismatch' : 'verify-failed');
          return;
        }
        setStep('done');
        doneTimer.current = setTimeout(onSignedIn, DONE_DWELL_MS);
      } catch {
        setOffline(true);
      } finally {
        verifyInFlight.current = false;
        setVerifying(false);
      }
    },
    [phone, onSignedIn],
  );

  const onOtpChange = (v: string) => {
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    setOtp(v);
    setOtpFailure(null); // any edit clears the error (spec §5)
  };

  const onOtpComplete = (code: string) => {
    // Auto-verify shortly after the 6th digit — no submit button exists (spec §5).
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    verifyTimer.current = setTimeout(() => void verify(code), AUTO_VERIFY_DELAY_MS);
  };

  const changeNumber = () => {
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    setOtp('');
    setOtpFailure(null);
    setCallRequested(false);
    setStep('phone'); // entered phone is preserved in the field (spec §5)
  };

  const requestCall = () => {
    // TODO(auth-tenancy roadmap task 7): voice-OTP escalation seam — no server endpoint
    // exists yet (module ruling 4). Optimistic "calling" state only; do not invent an API.
    setCallRequested(true);
  };

  const openInvite = () => {
    // TODO(auth-tenancy roadmap task 6): invite accept /join flow lands here.
  };

  const secondary = theme.colors['text-secondary'];
  const phoneValue = (
    <AppText weight="500" color={theme.colors['text-primary']}>
      {formatPhone(phone)}
    </AppText>
  );

  const errorRow = (text: ReactNode) => (
    <View style={styles.inlineRow}>
      <CircleAlert size={16} strokeWidth={1.5} absoluteStrokeWidth color={theme.colors.danger} />
      <Small color={theme.colors.danger} weight="500">
        {text}
      </Small>
    </View>
  );

  const phoneStep = (
    <>
      <H1>
        <Trans id="Welcome back" />
      </H1>
      <AppText color={secondary} style={styles.lede}>
        <Trans id="Sign in with your phone number. No password — we'll text you a one-time code." />
      </AppText>
      <View style={styles.fieldGroup}>
        <Input
          label={i18n._('Mobile number')}
          value={phone}
          onChange={(t) => {
            setPhone(t.replace(/\D/g, '').slice(0, PHONE_NSN_LENGTH));
            setSendFailed(false); // editing the number clears the send error (web parity)
          }}
          placeholder="98765 43210"
          type="tel"
          mono
          density="expressive"
          helper={i18n._('Sent by SMS to your registered number.')}
          error={sendFailed ? i18n._("Couldn't send the code. Try again.") : undefined}
          disabled={sending}
          leading={
            <AppText mono weight="700" color={secondary}>
              +91
            </AppText>
          }
        />
      </View>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={sending}
        disabled={phone.length !== PHONE_NSN_LENGTH || sending}
        onClick={() => void sendCode('initial')}
        style={styles.continueBtn}
      >
        <Trans id="Continue" />
      </Button>
      {/* Module ruling 1: signup is web-only — RN's footer is the invite placeholder. */}
      <TextLink onPress={openInvite} style={styles.footerLink}>
        <Trans id="Joining a team? Open your invite link" />
      </TextLink>
    </>
  );

  const otpStep = (
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
      <TextLink onPress={changeNumber} style={styles.changeNumber}>
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
      ) : otpFailure === 'mismatch' ? (
        errorRow(<Trans id="That code doesn’t match. Check it and try again." />)
      ) : otpFailure === 'verify-failed' ? (
        errorRow(<Trans id="Couldn't check the code. Try again." />)
      ) : null}
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
          <TextLink onPress={() => void sendCode('resend')}>
            <Trans id="Resend code" />
          </TextLink>
        )}
      </View>
      {sendFailed ? errorRow(<Trans id="Couldn't send the code. Try again." />) : null}
      {resendCount >= CALL_CARD_AFTER_RESENDS ? (
        // C6: mockup radius 16 = --r-md on this compact card (logged spec conflict).
        <Card density="functional" style={styles.callCard}>
          <View style={styles.callRow}>
            <IconCircle
              icon={
                <Phone
                  size={20}
                  strokeWidth={1.5}
                  absoluteStrokeWidth
                  color={theme.colors.accent}
                />
              }
            />
            <View style={styles.callBody}>
              {callRequested ? (
                <Small color={secondary}>
                  <Trans
                    id="Calling +91 {phoneFormatted} now with your code. Keep the phone nearby."
                    values={{
                      phoneFormatted: (
                        <Small weight="500" color={theme.colors['text-primary']}>
                          {formatPhone(phone)}
                        </Small>
                      ),
                    }}
                  />
                </Small>
              ) : (
                <>
                  <Small color={secondary}>
                    <Trans id="Still no code after two tries?" />
                  </Small>
                  <TextLink onPress={requestCall}>
                    <Trans id="Call me with the code instead" />
                  </TextLink>
                </>
              )}
            </View>
          </View>
        </Card>
      ) : null}
    </>
  );

  const doneStep = (
    <>
      <View style={styles.successDisc}>
        <Check size={30} strokeWidth={1.5} absoluteStrokeWidth color={theme.colors.success} />
      </View>
      <H1 style={styles.doneTitle}>
        <Trans id="You're signed in" />
      </H1>
      <AppText color={secondary} style={styles.lede}>
        <Trans id="Welcome back. Taking you to your day." />
      </AppText>
    </>
  );

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
            {offline ? (
              <OfflineBanner
                message={i18n._("You're offline — check your connection and try again.")}
                style={styles.offline}
              />
            ) : null}
            <StepRise key={step} reduceMotion={reduceMotion}>
              {step === 'phone' ? phoneStep : step === 'otp' ? otpStep : doneStep}
            </StepRise>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas, overflow: 'hidden' },
  flex: { flex: 1 },
  scroller: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
  column: { width: '100%', maxWidth: COL_MAX },
  wordmark: { marginBottom: theme.spacing['sp-8'] },
  offline: { marginBottom: theme.spacing['sp-6'] },
  lede: { marginTop: theme.spacing['sp-3'] },
  fieldGroup: { marginTop: theme.spacing['sp-6'] },
  continueBtn: { marginTop: theme.spacing['sp-6'] },
  footerLink: { alignSelf: 'center', marginTop: theme.spacing['sp-6'] },
  changeNumber: { marginTop: theme.spacing['sp-2'] },
  otp: { marginTop: theme.spacing['sp-6'] },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-4'],
  },
  resendRow: { marginTop: theme.spacing['sp-6'], flexDirection: 'row' },
  callCard: { marginTop: theme.spacing['sp-4'], borderRadius: theme.radius['r-md'] },
  callRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-4'] },
  callBody: { flex: 1, gap: theme.spacing['sp-1'] },
  successDisc: {
    width: theme.spacing['sp-16'],
    height: theme.spacing['sp-16'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['success-bg'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { marginTop: theme.spacing['sp-6'] },
});
