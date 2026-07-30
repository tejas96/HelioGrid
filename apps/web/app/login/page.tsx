'use client';
import { LoginScreen } from '../../features/auth';

/** Route only — the screen and its logic live in features/auth/login (ADR-0022). */
export default function LoginPage() {
  return <LoginScreen />;
}
