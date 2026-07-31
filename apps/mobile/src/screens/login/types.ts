import type { LoginStep, OtpFailure } from '@heliogrid/domain';

/** Everything the login screen renders from. The screen holds no state of its own. */
export interface LoginViewModel {
  step: LoginStep;
  phone: string;
  otp: string;
  otpSession: number;
  offline: boolean;
  sending: boolean;
  sendFailed: boolean;
  verifying: boolean;
  otpFailure: OtpFailure | null;
  secondsLeft: number;
  resendCount: number;
  callRequested: boolean;
  canSubmitPhone: boolean;
  onPhoneChange(v: string): void;
  onSubmitPhone(): void;
  onOtpChange(v: string): void;
  onOtpComplete(code: string): void;
  onResend(): void;
  onChangeNumber(): void;
  onCallMe(): void;
  /** Module ruling 1: RN has no signup — the phone-step footer opens the invite link
   *  instead. Not a spec field the brief enumerated; added so PhoneStep can reach the
   *  handler without re-declaring the TODO(auth-tenancy roadmap task 6) it carries. */
  onOpenInvite(): void;
}
