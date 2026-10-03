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
  /**
   * The reader's notifications in one company. The list and the bell's count share the prefix, so
   * a read invalidates both at once and the badge never disagrees with the list (`F6-17`).
   */
  notifications: {
    all: (tenantId: string) => ['notifications', tenantId] as const,
    inbox: (tenantId: string, readState: string, typeGroups: readonly string[]) =>
      ['notifications', tenantId, 'inbox', readState, ...typeGroups] as const,
    unreadCount: (tenantId: string) => ['notifications', tenantId, 'unread-count'] as const,
  },
} as const;
