import { CATALOG_SOURCES } from '../catalog/vocabulary';

/**
 * The proposal's closed word lists (`M06`). Each is a readonly tuple, so contracts derives its
 * `z.enum` and each migration mirrors its pgEnum from this one list; a screen reads the same tuple,
 * so no package keeps a second copy (`vocabulary-copies`).
 */

/**
 * The status machine's states (`M06-45`, `M06-58`). Status moves by acts, never by edits; a person's
 * withdrawal and a lead closed lost, disqualified or junk both take `withdrawn`.
 */
export const PROPOSAL_STATUSES = [
  'draft',
  'shared',
  'accepted',
  'declined',
  'superseded',
  'withdrawn',
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/**
 * Who owns the system the proposal sells (`M06-06`): the customer buys it, or the customer pays for
 * the power it makes. Only the rendered document and the projection's honesty label differ.
 */
export const PROPOSAL_TYPES = ['customer_owns', 'customer_pays_for_power'] as const;
export type ProposalType = (typeof PROPOSAL_TYPES)[number];

/** A site's supply (`M06-09`, `M06-23`): what the inverter's phases are checked against. */
export const SUPPLY_PHASES = ['single', 'three'] as const;
export type SupplyPhase = (typeof SUPPLY_PHASES)[number];

/** How many phases a supply of this kind carries — the figure an inverter's own is compared with. */
export const PHASE_COUNT: Readonly<Record<SupplyPhase, 1 | 3>> = { single: 1, three: 3 };

/** `M06-09` — no maintenance, free maintenance, or a plan of so many years. */
export const MAINTENANCE_KINDS = ['none', 'free', 'years'] as const;
export type MaintenanceKind = (typeof MAINTENANCE_KINDS)[number];

/** `M06-09` — a discount is typed as a percent or as an amount, and a version records which. */
export const DISCOUNT_MODES = ['percent', 'amount'] as const;
export type DiscountMode = (typeof DISCOUNT_MODES)[number];

/**
 * Where a component line's facts came from (`M06-31`, `T-M06-026`): the catalog's own resolution
 * tiers, the company's saved parts list, or a line typed on this proposal. On the proposal line
 * only — the catalog names its four itself.
 */
export const COMPONENT_LINE_SOURCES = [...CATALOG_SOURCES, 'saved_part', 'custom'] as const;
export type ComponentLineSource = (typeof COMPONENT_LINE_SOURCES)[number];

/** How an inverter meets the grid, as the edit sheet names it (`M06-29`). */
export const INVERTER_TYPES = ['on_grid', 'off_grid', 'hybrid'] as const;
export type InverterType = (typeof INVERTER_TYPES)[number];

/** The pictures the platform offers for a cover (`M06-07`); the company's own photo is the fifth choice. */
export const COVER_PICTURES = ['home', 'villa', 'factory', 'society'] as const;
export type CoverPictureKey = (typeof COVER_PICTURES)[number];

/** A proposal's cover picture: one of the platform's, or the company's own stored photo. */
export type CoverPicture =
  | { readonly kind: 'platform'; readonly key: CoverPictureKey }
  | { readonly kind: 'own'; readonly fileId: string };

/** The cover a company starts with until it picks another (`T-M01-030`). */
export const DEFAULT_COVER_PICTURE: CoverPicture = { kind: 'platform', key: 'home' };

/** Why a version exists (`M06-42`): the first Generate, or a later one after a change. */
export const VERSION_TRIGGERS = ['first_generate', 'regenerate'] as const;
export type VersionTrigger = (typeof VERSION_TRIGGERS)[number];

/**
 * The two acts that mark a proposal shared in V1 (`M06-53`, `T-M06-018`): each is a tap the person
 * made, never a delivery the product saw. Downloading the PDF shares nothing.
 */
export const SHARE_CHANNELS = ['whatsapp', 'copy_link'] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];

/** What the customer may answer on a version (`M06-45`, `F5-43`): one answer, once. */
export const PROPOSAL_ANSWERS = ['accept', 'negotiate', 'decline'] as const;
export type ProposalAnswer = (typeof PROPOSAL_ANSWERS)[number];

/** Whether a figure was filled for the person or typed by them (`M06-10`, `M06-11`). */
export const FILL_ORIGINS = ['auto', 'edited'] as const;
export type FillOrigin = (typeof FILL_ORIGINS)[number];

/**
 * The bounds the builder states where a value is typed and Generate checks again. Each is its PRD
 * row's own figure; a stored value a later design derives is never bounded by these (`T-M06-005`).
 */
export const PROPOSAL_LIMITS = {
  /** `M06-09` — system capacity, kW. */
  capacityKw: { min: 0.5, max: 7000 },
  /** `T-M06-005` — the size stepper's step, kW. */
  capacityStepKw: 0.5,
  /** `M06-27` — a section lists one to three brands, read as alternatives. */
  brandsPerCategory: 3,
  /** `M06-29` — a component's one line for the customer, characters. */
  componentDescription: 110,
  /** `M06-30` — battery capacity, kWh. */
  batteryKwh: { min: 1, max: 100 },
  /** `M06-10` — efficiency or performance ratio, percent. */
  efficiencyPercent: { min: 50, max: 100 },
  /** `M06-09`, `M06-40` — the EMI's yearly interest rate, percent. */
  emiRatePercent: { min: 0, max: 100 },
  /** `M06-09` — the electricity tariff per kWh, in the tenant currency's major unit. */
  tariffPerKwh: { min: 1, max: 50 },
  /** `M06-09` — a paid maintenance plan, years. */
  maintenanceYears: { min: 1, max: 8 },
  /** `T-M06-008` — a timeline step's name and sentence, characters. */
  phaseName: 60,
  phaseDescription: 120,
  /** `M06-15` — the terms run to three pages at most. */
  termsPages: 3,
} as const;

/**
 * `M06-15` — the days from its date a proposal stays valid, as the platform's default terms state
 * it. A sentence of the terms, never a field: no expiry is stored or acted on.
 */
export const PROPOSAL_VALIDITY_DAYS = 30;
