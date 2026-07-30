import type { FormEvent } from 'react';

export type Step = 'phone' | 'otp' | 'done';
/** mismatch = INVALID_OTP family (wrong/expired, 4xx); the others are transport/server. */
export type OtpFailure = 'mismatch' | 'verify-failed' | 'resend-failed';

export interface LoginViewModel {
  step: Step;
  phone: string;
  online: boolean;
  sending: boolean;
  sendError: boolean;
  otpFailure: OtpFailure | null;
  resendIn: number;
  showCallOffer: boolean;
  onPhoneChange(v: string): void;
  onSubmitPhone(e: FormEvent): void;
  onOtpComplete(code: string): void;
  onResend(): void;
  onChangeNumber(): void;
  /** Current OTP box contents — OtpInput (packages/ui) is a controlled component. */
  otp: string;
  /** Bumps remount OtpInput: clears boxes, restarts the countdown, refocuses box 1. */
  otpEpoch: number;
  verifying: boolean;
  callRequested: boolean;
  /** Fires on every keystroke; onOtpComplete only fires once all digits are entered. */
  onOtpChange(v: string): void;
  onCallMe(): void;
}
