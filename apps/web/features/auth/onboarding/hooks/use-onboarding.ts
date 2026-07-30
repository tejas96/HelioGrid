'use client';
import type { TenantSegment } from '@heliogrid/contracts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, envelopeMessage } from '../../../../lib/api-client';

/** Onboarding controller — SignUpFlow/WhatYouSell Stage-0 (name the workspace, pick what
 *  you sell). Segment copy and option iteration are the screen's job (apps/web/CLAUDE.md
 *  landmine: labels must stay a Record<TenantSegment, …> keyed off
 *  tenantSegmentSchema.options) — this hook only owns the enum-driven state and the
 *  submit mutation. */
export function useOnboarding() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [userName, setUserName] = useState('');
  const [segment, setSegment] = useState<TenantSegment>('both');
  const [error, setError] = useState<string | null>(null);
  const onboarding = api.auth.completeOnboarding.useMutation();
  const busy = onboarding.isPending;

  const submit = async () => {
    setError(null);
    try {
      // Typed client: body and response are contract-checked at compile time. Non-2xx
      // rejects, so a resolved value is the declared 201 body — nothing else can compile.
      await onboarding.mutateAsync({
        body: { tenantName, userName, segment, language: 'en' },
      });
      router.push('/home');
    } catch (err) {
      setError(envelopeMessage(err) ?? 'Could not create the workspace.');
    }
  };

  return {
    tenantName,
    userName,
    segment,
    error,
    busy,
    canSubmit: !busy && tenantName.length >= 2 && userName.length >= 1,
    onTenantNameChange: setTenantName,
    onUserNameChange: setUserName,
    onSegmentChange: setSegment,
    onSubmit: submit,
  };
}
