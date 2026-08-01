'use client';
import type { TenantSegment } from '@heliogrid/domain';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Onboarding controller — SignUpFlow/WhatYouSell Stage-0 (name the workspace, pick what
 *  you sell). Segment copy and option iteration are the screen's job (apps/web/CLAUDE.md
 *  landmine: labels must stay a Record<TenantSegment, …> keyed off the canonical
 *  TENANT_SEGMENTS list) — this hook only owns the enum-driven state and the submit. */
export function useOnboarding() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [userName, setUserName] = useState('');
  const [segment, setSegment] = useState<TenantSegment>('both');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /*
   * The completeOnboarding endpoint was removed with auth (owner ruling 2026-08-01), so the
   * screen advances locally and the design stays walkable. The rebuild restores the mutation
   * HERE — `error` and `busy` already exist for it, and nothing else in this file changes.
   */
  const submit = async () => {
    setError(null);
    setBusy(true);
    router.push('/home');
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
