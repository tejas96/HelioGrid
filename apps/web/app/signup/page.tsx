'use client';
import { SignupScreen } from '../../features/auth';

/** Route only — the screen and its logic live in features/auth/signup (ADR-0022). */
export default function SignupPage() {
  return <SignupScreen />;
}
