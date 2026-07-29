'use client';
import { COUNTRY_CALLING_CODE, PHONE_NSN_LENGTH } from '@heliogrid/contracts';
import {
  BloomLayer,
  Button,
  Card,
  IconCircle,
  Input,
  OfflineBanner,
  OtpInput,
  Spinner,
  TextLink,
  Wordmark,
} from '@heliogrid/ui';
import { Trans, useLingui } from '@lingui/react';
import { Check, CircleAlert, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { authClient } from '../../lib/auth-client';
import './styles.css';

const RESEND_SECONDS = 30;
const CALL_OFFER_AFTER_RESENDS = 2;
/** Spec §5: auto-verify fires 140ms after the 6th digit lands (behavioural, not motion). */
const AUTO_VERIFY_DELAY_MS = 140;
/** Spec Q9 leaves the done-step dwell open — brief beat so "You're signed in" registers. */
const DONE_REDIRECT_DWELL_MS = 1400;

type Step = 'phone' | 'otp' | 'done';
/** mismatch = INVALID_OTP family (wrong/expired, 4xx); the others are transport/server. */
type OtpFailure = 'mismatch' | 'verify-failed' | 'resend-failed';

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/** Login — phone → OTP → done (docs/modules/auth-tenancy/specs/login.md is law).
 *  S1: OTP login is sendOtp → verify (verify creates the session), never signIn. */
export default function Login() {
  const router = useRouter();
  const { i18n } = useLingui();
  const online = useOnline();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  const [otp, setOtp] = useState('');
  /** Bumps remount OtpInput: clears boxes, restarts the countdown, refocuses box 1. */
  const [otpEpoch, setOtpEpoch] = useState(0);
  const [failure, setFailure] = useState<OtpFailure | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendCount, setResendCount] = useState(0);
  const [callRequested, setCallRequested] = useState(false);

  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyInFlight = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: otpEpoch is the deliberate restart trigger — every resend rewinds the countdown
  useEffect(() => {
    if (step !== 'otp') return;
    setSecondsLeft(RESEND_SECONDS);
    const interval = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [step, otpEpoch]);

  useEffect(
    () => () => {
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
    },
    [],
  );

  // Done: brief dwell, then the app (session cookie already set by verify)
  useEffect(() => {
    if (step !== 'done') return;
    const timer = setTimeout(() => router.push('/home'), DONE_REDIRECT_DWELL_MS);
    return () => clearTimeout(timer);
  }, [step, router]);

  const phoneFormatted = `${phone.slice(0, 5)} ${phone.slice(5)}`;

  const requestCode = useCallback(async () => {
    try {
      const { error } = await authClient.phoneNumber.sendOtp({
        phoneNumber: `${COUNTRY_CALLING_CODE}${phone}`,
      });
      return !error;
    } catch {
      return false;
    }
  }, [phone]);

  const handleContinue = async (event: FormEvent) => {
    event.preventDefault();
    if (sending || phone.length !== PHONE_NSN_LENGTH || !online) return;
    setSending(true);
    setSendError(false);
    const ok = await requestCode();
    setSending(false);
    if (!ok) {
      setSendError(true);
      return;
    }
    // fresh OTP entry (spec §5): boxes/error cleared, resend count reset, countdown restarts
    setOtp('');
    setFailure(null);
    setResendCount(0);
    setCallRequested(false);
    setOtpEpoch((n) => n + 1);
    setStep('otp');
  };

  const verify = useCallback(
    async (code: string) => {
      if (verifyInFlight.current) return;
      verifyInFlight.current = true;
      setVerifying(true);
      setFailure(null);
      try {
        const { error } = await authClient.phoneNumber.verify({
          phoneNumber: `${COUNTRY_CALLING_CODE}${phone}`,
          code,
        });
        if (error) {
          // 4xx = INVALID_OTP (wrong or expired) → spec copy; digits retained for editing
          setFailure(error.status && error.status < 500 ? 'mismatch' : 'verify-failed');
          return;
        }
        setStep('done');
      } catch {
        setFailure('verify-failed');
      } finally {
        verifyInFlight.current = false;
        setVerifying(false);
      }
    },
    [phone],
  );

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setFailure(null); // any edit clears the error state (spec §5)
    if (verifyTimer.current) {
      clearTimeout(verifyTimer.current);
      verifyTimer.current = null;
    }
  };

  const handleOtpComplete = (code: string) => {
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    verifyTimer.current = setTimeout(() => verify(code), AUTO_VERIFY_DELAY_MS);
  };

  const handleResend = async () => {
    if (sending || verifying || !online) return;
    setSending(true);
    setFailure(null);
    const ok = await requestCode();
    setSending(false);
    if (!ok) {
      setFailure('resend-failed');
      return;
    }
    setOtp('');
    setResendCount((n) => n + 1);
    setOtpEpoch((n) => n + 1);
  };

  const handleChangeNumber = () => {
    if (verifying) return;
    if (verifyTimer.current) {
      clearTimeout(verifyTimer.current);
      verifyTimer.current = null;
    }
    setOtp('');
    setFailure(null);
    setStep('phone'); // entered phone is preserved in the field (spec §5)
  };

  const handleCallMe = () => {
    // TODO(docs/modules/auth-tenancy roadmap task 7): voice-call OTP delivery (Exotel)
    // has no server seam yet — render the requested state optimistically, no endpoint.
    setCallRequested(true);
  };

  const callOffered = resendCount >= CALL_OFFER_AFTER_RESENDS;

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
          {online ? null : (
            <div className="lg-offline">
              <OfflineBanner
                message={<Trans id="You're offline — check your connection and try again." />}
              />
            </div>
          )}
          <div className="lg-mark">
            <Wordmark />
          </div>

          {step === 'phone' ? (
            <form className="lg-step" onSubmit={handleContinue} aria-busy={sending || undefined}>
              <h1 className="lg-h1">
                <Trans id="Welcome back" />
              </h1>
              <p className="lg-body">
                <Trans id="Sign in with your phone number. No password — we'll text you a one-time code." />
              </p>
              <div className="lg-field">
                <Input
                  label={<Trans id="Mobile number" />}
                  mono
                  type="tel"
                  inputMode="tel"
                  name="phone"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phone}
                  disabled={sending}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, '').slice(0, PHONE_NSN_LENGTH));
                    setSendError(false);
                  }}
                  leading={<span className="lg-prefix">+91</span>}
                  helper={i18n._('Sent by SMS to your registered number.')}
                  error={sendError ? i18n._("Couldn't send the code. Try again.") : undefined}
                />
              </div>
              <div className="lg-cta">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={sending}
                  disabled={phone.length !== PHONE_NSN_LENGTH || sending || !online}
                >
                  <Trans id="Continue" />
                </Button>
              </div>
              <p className="lg-footer">
                <Trans id="New company?" />{' '}
                <TextLink href="/signup">
                  <Trans id="Create an account" />
                </TextLink>
              </p>
            </form>
          ) : null}

          {step === 'otp' ? (
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
                <TextLink onClick={handleChangeNumber}>
                  <Trans id="Change number" />
                </TextLink>
              </div>
              <div className="lg-otp">
                <OtpInput
                  key={otpEpoch}
                  label={i18n._('6-digit code')}
                  value={otp}
                  onChange={handleOtpChange}
                  onComplete={handleOtpComplete}
                  error={failure === 'mismatch'}
                  disabled={verifying}
                  autoFocus
                />
              </div>
              {failure !== null ? (
                <p className="lg-error" role="alert">
                  <CircleAlert size={16} strokeWidth={1.5} aria-hidden />
                  {failure === 'mismatch' ? (
                    <Trans id="That code doesn’t match. Check it and try again." />
                  ) : failure === 'verify-failed' ? (
                    <Trans id="Couldn't check the code. Try again." />
                  ) : (
                    <Trans id="Couldn't send the code. Try again." />
                  )}
                </p>
              ) : null}
              <div className="lg-resend" aria-live="polite">
                {verifying || sending ? (
                  <Spinner size="sm" />
                ) : secondsLeft === 0 ? (
                  <TextLink onClick={handleResend}>
                    <Trans id="Resend code" />
                  </TextLink>
                ) : (
                  <span>
                    <Trans
                      id="Resend code in {time}"
                      values={{
                        time: (
                          <span className="lg-mono">{`0:${String(secondsLeft).padStart(2, '0')}`}</span>
                        ),
                      }}
                    />
                  </span>
                )}
              </div>
              {callOffered ? (
                <div className="lg-call">
                  <Card density="functional">
                    <div className="lg-call-row">
                      <IconCircle
                        icon={<Phone size={20} strokeWidth={1.5} />}
                        color="var(--accent)"
                      />
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
                            <TextLink onClick={handleCallMe}>
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
          ) : null}

          {step === 'done' ? (
            <div className="lg-step lg-done" role="status">
              <IconCircle
                icon={<Check size={30} strokeWidth={1.5} />}
                color="var(--success)"
                size={64}
              />
              <h1 className="lg-h1 lg-done-h1">
                <Trans id="You're signed in" />
              </h1>
              <p className="lg-body">
                <Trans id="Welcome back. Taking you to your day." />
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
