'use client';
import { useSession } from '@heliogrid/data/react';
import {
  AUTO_VERIFY_DELAY_MS,
  CALL_OFFER_AFTER_RESENDS,
  COUNTRY_CALLING_CODE,
  DONE_DWELL_MS,
  type LoginStep,
  type OtpFailure,
  PHONE_NSN_LENGTH,
} from '@heliogrid/domain';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useOnline } from '../../shared/hooks/use-online';
import type { LoginViewModel } from '../types';
import { useResendCountdown } from './use-resend-countdown';

/** Login controller — phone → OTP → done.
 *  S1: OTP login is sendOtp → verify (verify creates the session), never signIn. */
export function useLogin(): LoginViewModel {
  const router = useRouter();
  const online = useOnline();
  const session = useSession();

  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  const [otp, setOtp] = useState('');
  /** Bumps remount OtpInput: clears boxes, restarts the countdown, refocuses box 1. */
  const [otpEpoch, setOtpEpoch] = useState(0);
  const [failure, setFailure] = useState<OtpFailure | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [callRequested, setCallRequested] = useState(false);

  const secondsLeft = useResendCountdown(step === 'otp', otpEpoch);

  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyInFlight = useRef(false);

  useEffect(
    () => () => {
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
    },
    [],
  );

  // Done: brief dwell, then the app (session cookie already set by verify)
  useEffect(() => {
    if (step !== 'done') return;
    const timer = setTimeout(() => router.push('/home'), DONE_DWELL_MS);
    return () => clearTimeout(timer);
  }, [step, router]);

  const requestCode = useCallback(async () => {
    const result = await session.requestOtp(`${COUNTRY_CALLING_CODE}${phone}`);
    return result.ok;
  }, [phone, session]);

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
      // No try/catch: OtpResult carries the wrong-code vs transport distinction in the
      // return type, so there is no throw left to swallow.
      const result = await session.verifyOtp(`${COUNTRY_CALLING_CODE}${phone}`, code);
      if (result.ok) setStep('done');
      else setFailure(result.failure);
      verifyInFlight.current = false;
      setVerifying(false);
    },
    [phone, session],
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
    // TODO(voice-OTP): voice-call OTP delivery (Exotel)
    // has no server seam yet — render the requested state optimistically, no endpoint.
    setCallRequested(true);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, '').slice(0, PHONE_NSN_LENGTH));
    setSendError(false);
  };

  return {
    step,
    phone,
    online,
    sending,
    sendError,
    otpFailure: failure,
    resendIn: secondsLeft,
    showCallOffer: resendCount >= CALL_OFFER_AFTER_RESENDS,
    onPhoneChange: handlePhoneChange,
    onSubmitPhone: handleContinue,
    onOtpComplete: handleOtpComplete,
    onResend: handleResend,
    onChangeNumber: handleChangeNumber,
    otp,
    otpEpoch,
    verifying,
    callRequested,
    onOtpChange: handleOtpChange,
    onCallMe: handleCallMe,
  };
}
