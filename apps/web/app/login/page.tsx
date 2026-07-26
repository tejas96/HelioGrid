'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '../../lib/auth-client';

/** Login/LoginFlow — phone → OTP (S1: sendOtp → verify; verify creates the session). */
export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
    setBusy(false);
    if (err) return setError(err.message ?? 'Could not send the code. Check the number.');
    setStep('otp');
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.phoneNumber.verify({ phoneNumber: phone, code });
    setBusy(false);
    if (err) return setError('That code did not match. Try again.');
    router.push('/home');
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-[var(--screen-pad-mobile)]">
      <section className="hg-card w-full max-w-md" aria-busy={busy}>
        <p className="hg-overline">HelioGrid</p>
        <h1 className="hg-h1">{step === 'phone' ? 'Sign in with your phone' : 'Enter the code'}</h1>
        <p className="hg-muted">
          {step === 'phone'
            ? 'We send a one-time code over SMS.'
            : `Code sent to ${phone}. It expires in 5 minutes.`}
        </p>
        {step === 'phone' ? (
          <input
            className="hg-input"
            type="tel"
            inputMode="tel"
            aria-label="Phone number in international format"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        ) : (
          <input
            className="hg-input"
            inputMode="numeric"
            maxLength={6}
            aria-label="Six digit one-time code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
          />
        )}
        {error ? (
          <p className="hg-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="hg-btn-primary w-full"
          disabled={busy}
          onClick={step === 'phone' ? sendOtp : verify}
        >
          {busy ? 'Working…' : step === 'phone' ? 'Send code' : 'Verify and sign in'}
        </button>
        {step === 'otp' ? (
          <button type="button" className="hg-btn-ghost" onClick={() => setStep('phone')}>
            Use a different number
          </button>
        ) : null}
      </section>
    </main>
  );
}
