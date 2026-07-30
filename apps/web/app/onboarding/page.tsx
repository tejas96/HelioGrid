'use client';
import { OnboardingScreen } from '../../features/auth';

/** Route only — the screen and its logic live in features/auth/onboarding (ADR-0022). */
export default function OnboardingPage() {
  return <OnboardingScreen />;
}
