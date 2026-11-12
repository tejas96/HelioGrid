import type { UiLanguage } from '@heliogrid/contracts';

/**
 * Every query key in both apps. Centralised because scattered keys are how two screens end
 * up unable to invalidate each other's cache.
 */
export const queryKeys = {
  health: {
    liveness: ['health', 'liveness'] as const,
  },
  /**
   * The projects (`M08`), keyed by the company. An act answers the project and lets the board, the
   * jobs and the handover read again — they derive from the same rows.
   */
  projects: {
    all: (tenantId: string) => ['projects', tenantId] as const,
    board: (tenantId: string) => ['projects', tenantId, 'board'] as const,
    handedOver: (tenantId: string) => ['projects', tenantId, 'handed-over'] as const,
    detail: (tenantId: string, projectId: string) =>
      ['projects', tenantId, 'detail', projectId] as const,
    handover: (tenantId: string, projectId: string) =>
      ['projects', tenantId, 'handover', projectId] as const,
    people: (tenantId: string, role: 'manager' | 'crew') =>
      ['projects', tenantId, 'people', role] as const,
    jobs: (tenantId: string) => ['projects', tenantId, 'jobs'] as const,
    /** A project's money (`SCR-M11-02`): under the projects, so a project's change refreshes it. */
    payments: (tenantId: string, projectId: string) =>
      ['projects', tenantId, 'payments', projectId] as const,
    /** Money due's page, or one group's rows alone. */
    moneyDue: (tenantId: string, limit: number, group: string | null = null) =>
      ['projects', tenantId, 'money-due', limit, group] as const,
    /** Under the projects, so a payment recorded or reversed asks again. */
    referenceCheck: (tenantId: string, referenceKey: string) =>
      ['projects', tenantId, 'reference', referenceKey] as const,
  },
  /** The owner dashboard (`SCR-M13-01`): its own prefix — a periodic read, asked again on its target. */
  dashboards: {
    owner: (tenantId: string) => ['dashboards', tenantId, 'owner'] as const,
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
    branding: (tenantId: string) => ['settings', tenantId, 'branding'] as const,
    /**
     * Keyed by the reader's language too: a template the company never saved is the platform's,
     * answered in the reader's words, so a language switch must ask again (`F3-10`).
     */
    proposalTemplate: (tenantId: string, reader: UiLanguage) =>
      [...queryKeys.settings.proposalTemplates(tenantId), reader] as const,
    timelineTemplate: (tenantId: string, reader: UiLanguage) =>
      [...queryKeys.settings.timelineTemplates(tenantId), reader] as const,
    /** Every reader's copy of the template, so a save can let the other languages' copies go. */
    proposalTemplates: (tenantId: string) => ['settings', tenantId, 'proposal-template'] as const,
    timelineTemplates: (tenantId: string) => ['settings', tenantId, 'timeline-template'] as const,
    trancheTemplates: (tenantId: string) => ['settings', tenantId, 'tranche-templates'] as const,
    collections: (tenantId: string) => ['settings', tenantId, 'collections'] as const,
    /** One schedule per split: the key is the shares, so only the answer for the lines shown is drawn. */
    trancheSchedule: (tenantId: string, shares: readonly string[]) =>
      ['settings', tenantId, 'tranche-schedule', shares.join('/')] as const,
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
  /**
   * A company's catalog. Every act refreshes the whole prefix: an override moves a row's price,
   * its layer, the release a publish would make and the counts the page shows.
   */
  catalog: {
    all: (tenantId: string) => ['catalog', tenantId] as const,
    items: (tenantId: string, ask: unknown) => ['catalog', tenantId, 'items', ask] as const,
    count: (tenantId: string, of: 'all' | 'archived' | 'changed') =>
      ['catalog', tenantId, 'count', of] as const,
    /** One kind's item count, for the kind chips: under the prefix, so every act refreshes it. */
    kindCount: (tenantId: string, kind: string) =>
      ['catalog', tenantId, 'kind-count', kind] as const,
    releases: (tenantId: string) => ['catalog', tenantId, 'releases'] as const,
    release: (tenantId: string, id: string) => ['catalog', tenantId, 'release', id] as const,
    /** What a publish now would carry: under the prefix, so every act and the publish refresh it. */
    preview: (tenantId: string) => ['catalog', tenantId, 'preview'] as const,
    /**
     * The company's imports, under the prefix: a run writes prices, so the whole catalog refreshes
     * when one completes, and a fix refreshes its job's rows.
     */
    imports: (tenantId: string) => ['catalog', tenantId, 'imports'] as const,
    import: (tenantId: string, id: string) => ['catalog', tenantId, 'import', id] as const,
    importRows: (tenantId: string, id: string, ask?: unknown) =>
      ask === undefined
        ? (['catalog', tenantId, 'import', id, 'rows'] as const)
        : (['catalog', tenantId, 'import', id, 'rows', ask] as const),
  },
  /**
   * A company's CRM (`M02`). One prefix, because one act moves many reads at once: an assign moves
   * the lead, the inbox, the lists, the timeline and every assignee's load; a merge moves both
   * customers and every lead under them; an import run lands leads into every list. Every write
   * refreshes the whole prefix.
   */
  crm: {
    all: (tenantId: string) => ['crm', tenantId] as const,
    /** The live number check (`M02-07`): under the prefix, so a capture asks again. */
    match: (tenantId: string, phoneE164: string) => ['crm', tenantId, 'match', phoneE164] as const,
    leads: (tenantId: string, ask: unknown) => ['crm', tenantId, 'leads', ask] as const,
    /** My Day (`SCR-M07-01`): under the prefix, so every CRM write asks again. */
    myDay: (tenantId: string) => ['crm', tenantId, 'my-day'] as const,
    inbox: (tenantId: string, ask: unknown) => ['crm', tenantId, 'inbox', ask] as const,
    lead: (tenantId: string, leadId: string) => ['crm', tenantId, 'lead', leadId] as const,
    leadTimeline: (tenantId: string, leadId: string, ask: unknown) =>
      ['crm', tenantId, 'lead', leadId, 'activities', ask] as const,
    /** The lead's files (`M02-32`), oldest first. */
    leadFiles: (tenantId: string, leadId: string) =>
      ['crm', tenantId, 'lead', leadId, 'files'] as const,
    customerTimeline: (tenantId: string, customerId: string, ask: unknown) =>
      ['crm', tenantId, 'customer', customerId, 'activities', ask] as const,
    /** Each person's open and overdue counts at this moment (`M02-28`). */
    assignees: (tenantId: string) => ['crm', tenantId, 'assignees'] as const,
    /** Who a site visit can go to (`M02-46`). */
    visitSurveyors: (tenantId: string) => ['crm', tenantId, 'visit-surveyors'] as const,
    contactRoleLabels: (tenantId: string) => ['crm', tenantId, 'contact-role-labels'] as const,
    mergePreview: (tenantId: string, survivorId: string, loserId: string) =>
      ['crm', tenantId, 'merge-preview', survivorId, loserId] as const,
    leadImport: (tenantId: string, id: string) => ['crm', tenantId, 'lead-import', id] as const,
    /** The import this device follows, so leaving and coming back finds it (`M02-21`). Never read from the api. */
    leadImportFollowed: (tenantId: string) => ['crm', tenantId, 'lead-import-followed'] as const,
    leadImportRows: (tenantId: string, id: string, ask?: unknown) =>
      ask === undefined
        ? (['crm', tenantId, 'lead-import', id, 'rows'] as const)
        : (['crm', tenantId, 'lead-import', id, 'rows', ask] as const),
  },
  /**
   * The global search (`F6-24`), keyed by what was typed. Outside the CRM prefix: it reads catalog
   * and people too, so an act taken from a result — a junk lead's Reopen — refreshes both prefixes.
   */
  search: (tenantId: string, ask?: unknown) =>
    ask === undefined ? (['search', tenantId] as const) : (['search', tenantId, ask] as const),
  /** A company's price book; a new version refreshes the whole prefix. */
  priceBook: {
    all: (tenantId: string) => ['price-book', tenantId] as const,
    active: (tenantId: string) => ['price-book', tenantId, 'active'] as const,
    versions: (tenantId: string) => ['price-book', tenantId, 'versions'] as const,
    version: (tenantId: string, id: string) => ['price-book', tenantId, 'version', id] as const,
  },
  /** A market's published pack: reference data with no company's fact in it, so keyed by market alone. */
  market: {
    pack: (marketCode: string) => ['market', marketCode, 'pack'] as const,
  },
  /**
   * A company's billing (`SCR-M12-02`). One prefix, so an act that moves the subscription
   * invalidates the standing, the home and every record at once.
   */
  billing: {
    all: (tenantId: string) => ['billing', tenantId] as const,
    standing: (tenantId: string) => ['billing', tenantId, 'standing'] as const,
    home: (tenantId: string) => ['billing', tenantId, 'home'] as const,
    documents: (tenantId: string, q: string, status: string, page: number) =>
      ['billing', tenantId, 'documents', q, status, page] as const,
    reminders: (tenantId: string, page: number) =>
      ['billing', tenantId, 'reminders', page] as const,
    history: (tenantId: string, page: number) => ['billing', tenantId, 'history', page] as const,
    /** This cycle's usage (`SCR-M12-04`), the member's signals, and one meter's events. */
    usage: (tenantId: string) => ['billing', tenantId, 'usage'] as const,
    usageSignals: (tenantId: string) => ['billing', tenantId, 'usage-signals'] as const,
    usageEvents: (tenantId: string, meter: string) =>
      ['billing', tenantId, 'usage-events', meter] as const,
    /** One pick's review (`SCR-M12-03`): under the prefix, so a landed act reads it again. */
    planChangePreview: (tenantId: string, tier: string, cycle: string) =>
      ['billing', tenantId, 'plan-change-preview', tier, cycle] as const,
  },
  /**
   * Where Billing lands focus when another screen hands the person to it — `needs` after a
   * scheduled downgrade (`SCR-M12-03`). Outside the billing prefix: no read refetches it.
   */
  billingArrival: (tenantId: string) => ['billing-arrival', tenantId] as const,
  /** A market's public price list: no company's fact in it, so keyed by market alone. */
  pricing: {
    current: (marketCode: string) => ['pricing', marketCode] as const,
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
