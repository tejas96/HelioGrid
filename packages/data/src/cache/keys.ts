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
  /** A company's setup progress; a step's answer replaces what is held, so the gate reads it once. */
  setup: {
    progress: (tenantId: string) => ['setup', tenantId, 'progress'] as const,
  },
  /** A company's settings as stored; a write's answer replaces what is held. */
  settings: {
    businessProfile: (tenantId: string) => ['settings', tenantId, 'business-profile'] as const,
    taxRegistrations: (tenantId: string) => ['settings', tenantId, 'tax-registrations'] as const,
  },
  /** A company's people and its invites; a write to either refreshes the whole list under the prefix. */
  team: {
    members: (tenantId: string) => ['team', tenantId, 'members'] as const,
    invites: (tenantId: string) => ['team', tenantId, 'invites'] as const,
    /** The company's owners by name, for the role card's note: a role change refreshes it too. */
    owners: (tenantId: string) => ['team', tenantId, 'owners'] as const,
  },
  /**
   * The Assign Roles ticks kept while the Roles reference is open (`useAssignRoles`' `stepAside`).
   * Outside `team` on purpose: a write that refreshes the team list must never drop them.
   */
  assignDraft: (tenantId: string) => ['assign-draft', tenantId] as const,
  /** My photo in one company: a photo write of mine refreshes it. */
  myPhoto: (tenantId: string) => ['my-photo', tenantId] as const,
  /** A stored file's link. It dies in minutes, so a screen asks again when it next opens. */
  files: {
    downloadUrl: (tenantId: string, fileId: string) =>
      ['files', tenantId, fileId, 'download-url'] as const,
  },
  /** A market's published pack: reference data with no company's fact in it, so keyed by market alone. */
  market: {
    pack: (marketCode: string) => ['market', marketCode, 'pack'] as const,
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
  /**
   * The reader's push switches; a write's answer replaces its row. Outside the notifications
   * prefix, so marking a record read does not read the switches again.
   */
  pushPreferences: (tenantId: string) => ['push-preferences', tenantId] as const,
} as const;
