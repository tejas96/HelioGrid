/**
 * Every query key in both apps. Centralised because scattered keys are how two screens end
 * up unable to invalidate each other's cache.
 */
export const queryKeys = {
  health: {
    liveness: ['health', 'liveness'] as const,
  },
  /** Keyed by the company, so one person's facts are never served under another company. */
  shell: {
    tenant: (tenantId: string) => ['shell', tenantId, 'tenant'] as const,
    membership: (tenantId: string) => ['shell', tenantId, 'membership'] as const,
  },
} as const;
