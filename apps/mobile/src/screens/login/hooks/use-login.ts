import { useSession } from '@heliogrid/data/react';
import {
  AUTO_VERIFY_DELAY_MS,
  COUNTRY_CALLING_CODE,
  type LoginStep,
  type OtpFailure,
  PHONE_NSN_LENGTH,
} from '@heliogrid/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LoginViewModel } from '../types';
import { useResendCountdown } from './use-resend-countdown';

/**
 * Login controller — phone → OTP → done (RN variant of the LoginFlow). The shared session
 * store sends and verifies; this hook owns only the flow. No signup on RN (module
 * ruling 1): the footer is the invite-link placeholder.
 *
 * The done-step DWELL is not here: verifying flips the session, and RootNavigator owns how
 * long the finished login stays on screen before the stack swaps. Timers and navigation are
 * the app's job, the decision is the store's (packages/domain/CLAUDE.md).
 */
export function useLogin(): LoginViewModel {
  const session = useSession();
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpFailure, setOtpFailure] = useState<OtpFailure | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [callRequested, setCallRequested] = useState(false);
  // Remount key for OtpInput: entry + every resend clear the boxes AND refocus box 1.
  const [otpSession, setOtpSession] = useState(0);

  const { secondsLeft, restart: restartCountdown } = useResendCountdown(step === 'otp');

  const stepRef = useRef(step);
  stepRef.current = step;
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendInFlight = useRef(false);
  const verifyInFlight = useRef(false);

  useEffect(
    () => () => {
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
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
        const result = await session.requestOtp(`${COUNTRY_CALLING_CODE}${phone}`);
        if (!result.ok) {
          setSendFailed(true);
          return;
        }
        setOtp('');
        setOtpFailure(null);
        setOtpSession((k) => k + 1);
        restartCountdown();
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
    [phone, restartCountdown, session],
  );

  const verify = useCallback(
    async (code: string) => {
      if (verifyInFlight.current) return;
      verifyInFlight.current = true;
      setVerifying(true);
      setOffline(false);
      try {
        const result = await session.verifyOtp(`${COUNTRY_CALLING_CODE}${phone}`, code);
        if (stepRef.current !== 'otp') return; // user changed number while in flight
        if (!result.ok) {
          setOtpFailure(result.failure);
          return;
        }
        setStep('done');
      } catch {
        setOffline(true);
      } finally {
        verifyInFlight.current = false;
        setVerifying(false);
      }
    },
    [phone, session],
  );

  const onPhoneChange = (v: string) => {
    setPhone(v.replace(/\D/g, '').slice(0, PHONE_NSN_LENGTH));
    setSendFailed(false); // editing the number clears the send error (web parity)
  };

  const onOtpChange = (v: string) => {
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    setOtp(v);
    // Spec §5: any edit clears the error. RN splits the three failures across two state
    // variables, so clearing only `otpFailure` left a failed-resend message on screen while
    // the user typed; web's single union clears all three in one call.
    setOtpFailure(null);
    setSendFailed(false);
  };

  const onOtpComplete = (code: string) => {
    // Auto-verify shortly after the 6th digit — no submit button exists (spec §5).
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    verifyTimer.current = setTimeout(() => void verify(code), AUTO_VERIFY_DELAY_MS);
  };

  const onChangeNumber = () => {
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    setOtp('');
    setOtpFailure(null);
    setCallRequested(false);
    setStep('phone'); // entered phone is preserved in the field (spec §5)
  };

  const onCallMe = () => {
    // TODO(voice-OTP): voice-OTP escalation seam — no server endpoint
    // exists yet (module ruling 4). Optimistic "calling" state only; do not invent an API.
    setCallRequested(true);
  };

  const onOpenInvite = () => {
    // TODO(invite-accept): invite accept /join flow lands here.
  };

  return {
    step,
    phone,
    otp,
    otpSession,
    offline,
    sending,
    sendFailed,
    verifying,
    otpFailure,
    secondsLeft,
    resendCount,
    callRequested,
    canSubmitPhone: phone.length === PHONE_NSN_LENGTH && !sending,
    onPhoneChange,
    onSubmitPhone: () => void sendCode('initial'),
    onOtpChange,
    onOtpComplete,
    onResend: () => void sendCode('resend'),
    onChangeNumber,
    onCallMe,
    onOpenInvite,
  };
}
