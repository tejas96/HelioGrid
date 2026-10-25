import type { Certification, CertificationScheme } from '../certification/pack';
import { type CatalogSpec, catalogSpecSchema, SPEC_FIELDS } from './specs';
import type { ComponentKind } from './vocabulary';

/**
 * The add sheet's draft (`SCR-M01-16`, `M01-36`, `M01-39`): one own item being typed, before it is
 * sent. A spec value is held by its dotted path (`mppt.maxV`) as `SPEC_FIELDS` names it, `null`
 * while unset; the price is the decimal as typed, `''` unset, so the wire gets what was typed.
 */
export interface ItemDraft {
  readonly kind: ComponentKind;
  readonly brand: string;
  readonly model: string;
  readonly spec: Readonly<Record<string, ItemSpecValue>>;
  readonly schemes: Readonly<Record<string, SchemeDraft>>;
  readonly price: string;
  /** *Add optional values* was pressed: the optional fields show while all are blank. */
  readonly optionalOpen: boolean;
}

export type ItemSpecValue = number | string | null;

export interface SchemeDraft {
  readonly on: boolean;
  readonly reference: string;
}

export type ItemDraftEvent =
  | { readonly type: 'kind'; readonly kind: ComponentKind }
  | { readonly type: 'brand'; readonly value: string }
  | { readonly type: 'model'; readonly value: string }
  | { readonly type: 'spec'; readonly path: string; readonly value: ItemSpecValue }
  | { readonly type: 'scheme'; readonly scheme: string; readonly on: boolean }
  | { readonly type: 'reference'; readonly scheme: string; readonly value: string }
  | { readonly type: 'price'; readonly value: string }
  | { readonly type: 'unfold' };

/** What a field failed on: unset, out of its range, or out of order with the field it names. */
export type ItemFieldIssue = 'required' | 'invalid' | 'exceeds' | 'atLeast';

export interface ItemFieldFailure {
  /** `brand`, `model`, `spec.<path>` or `certifications.<scheme>` — the body's own field path. */
  readonly path: string;
  readonly issue: ItemFieldIssue;
  /** The spec path it is compared with, on an order gate. */
  readonly than?: string;
}

/** The create body as `POST /catalog/items` takes it (`ownCatalogItemCreateSchema`). */
export interface OwnItemCreateBody {
  readonly brand: string;
  readonly model: string;
  readonly spec: CatalogSpec;
  readonly certifications: Certification[];
  readonly preferred: false;
  readonly rate?: { readonly amount: string };
}

export type ItemDraftJudgement =
  | { readonly ok: true; readonly body: OwnItemCreateBody }
  | { readonly ok: false; readonly failures: readonly ItemFieldFailure[] };

function blankSpecOf(kind: ComponentKind): Record<string, ItemSpecValue> {
  return Object.fromEntries(SPEC_FIELDS[kind].map((field) => [field.path, null]));
}

/** A fresh form for a kind: nothing typed, every scheme off. */
export function blankItemDraft(kind: ComponentKind): ItemDraft {
  return {
    kind,
    brand: '',
    model: '',
    spec: blankSpecOf(kind),
    schemes: {},
    price: '',
    optionalOpen: false,
  };
}

function valueAt(spec: CatalogSpec, path: string): ItemSpecValue {
  let at: unknown = spec;
  for (const key of path.split('.')) at = (at as Record<string, unknown> | undefined)?.[key];
  return typeof at === 'number' || typeof at === 'string' ? at : null;
}

/**
 * *Enter specs manually* from a selected item (`M01-39`): its brand, model and typed specs. Never
 * its certifications and never a price — a spec-edited variant is not the listed model.
 */
export function itemDraftFrom(item: {
  readonly brand: string;
  readonly model: string;
  readonly spec: CatalogSpec;
}): ItemDraft {
  const { kind } = item.spec;
  const spec = Object.fromEntries(
    SPEC_FIELDS[kind].map((field) => [field.path, valueAt(item.spec, field.path)]),
  );
  return { ...blankItemDraft(kind), brand: item.brand, model: item.model, spec };
}

/** Changing the kind keeps the brand and model and starts that kind's spec afresh. */
export function itemDraftAfter(draft: ItemDraft, event: ItemDraftEvent): ItemDraft {
  switch (event.type) {
    case 'kind':
      return event.kind === draft.kind
        ? draft
        : { ...draft, kind: event.kind, spec: blankSpecOf(event.kind), optionalOpen: false };
    case 'brand':
      return { ...draft, brand: event.value };
    case 'model':
      return { ...draft, model: event.value };
    case 'spec':
      return { ...draft, spec: { ...draft.spec, [event.path]: event.value } };
    case 'scheme':
    case 'reference':
      return { ...draft, schemes: schemesWith(draft, event) };
    case 'price':
      return { ...draft, price: event.value };
    case 'unfold':
      return { ...draft, optionalOpen: true };
  }
}

/** A scheme switched off with no reference typed holds nothing, so the draft reads as it opened. */
function schemesWith(
  draft: ItemDraft,
  event: Extract<ItemDraftEvent, { type: 'scheme' | 'reference' }>,
): Readonly<Record<string, SchemeDraft>> {
  const { [event.scheme]: now = { on: false, reference: '' }, ...rest } = draft.schemes;
  const next =
    event.type === 'scheme' ? { ...now, on: event.on } : { ...now, reference: event.value };
  return !next.on && next.reference === '' ? rest : { ...rest, [event.scheme]: next };
}

const isSet = (value: ItemSpecValue) => value !== null && value !== '';

/** Nothing typed yet: the Empty state's *What this form needs* shows. */
export function draftIsBlank(draft: ItemDraft): boolean {
  return (
    draft.brand.trim() === '' &&
    draft.model.trim() === '' &&
    !Object.values(draft.spec).some(isSet) &&
    draft.price === ''
  );
}

/** The draft differs from how it opened: leaving it asks first. */
export function draftIsDirty(draft: ItemDraft, opened: ItemDraft): boolean {
  return JSON.stringify(draft) !== JSON.stringify(opened);
}

/** The kind's optional spec paths, in the envelope's order. */
export function optionalPathsOf(kind: ComponentKind): readonly string[] {
  return SPEC_FIELDS[kind].filter((field) => !field.required).map((field) => field.path);
}

/** The optional values fold behind *Add optional values* while all are blank and it was not pressed. */
export function optionalFolded(draft: ItemDraft): boolean {
  return (
    !draft.optionalOpen &&
    !optionalPathsOf(draft.kind).some((path) => isSet(draft.spec[path] ?? null))
  );
}

function rawSpecOf(draft: ItemDraft): Record<string, unknown> {
  const raw: Record<string, unknown> = { kind: draft.kind };
  for (const [path, value] of Object.entries(draft.spec)) {
    if (!isSet(value)) continue;
    const keys = path.split('.');
    const leaf = keys.pop() as string;
    let at = raw;
    for (const key of keys) {
      at[key] ??= {};
      at = at[key] as Record<string, unknown>;
    }
    at[leaf] = value;
  }
  return raw;
}

function specFailures(draft: ItemDraft): { spec?: CatalogSpec; failures: ItemFieldFailure[] } {
  const parsed = catalogSpecSchema.safeParse(rawSpecOf(draft));
  if (parsed.success) return { spec: parsed.data, failures: [] };
  const failures = parsed.error.issues.map((issue): ItemFieldFailure => {
    const path = `spec.${issue.path.join('.')}`;
    const order = issue.code === 'custom' ? (issue.params as Record<string, string>) : undefined;
    if (order?.exceeds !== undefined) return { path, issue: 'exceeds', than: order.exceeds };
    if (order?.atLeast !== undefined) return { path, issue: 'atLeast', than: order.atLeast };
    const unset = issue.code === 'invalid_type' && issue.received === 'undefined';
    return { path, issue: unset ? 'required' : 'invalid' };
  });
  return { failures };
}

function certificationsOf(
  draft: ItemDraft,
  schemes: readonly CertificationScheme[],
): { certifications: Certification[]; failures: ItemFieldFailure[] } {
  const certifications: Certification[] = [];
  const failures: ItemFieldFailure[] = [];
  for (const { scheme, evidence } of schemes) {
    const held = draft.schemes[scheme];
    if (held?.on !== true) continue;
    if (evidence === 'flag') {
      certifications.push({ scheme, reference: null });
      continue;
    }
    const reference = held.reference.trim();
    if (reference === '') failures.push({ path: `certifications.${scheme}`, issue: 'required' });
    else certifications.push({ scheme, reference });
  }
  return { certifications, failures };
}

/**
 * The draft judged as the route will judge it: the spec through `catalogSpecSchema`, a switched-on
 * list scheme with its reference, the price only for a person who may write one (`priced`).
 */
export function judgeItemDraft(
  draft: ItemDraft,
  schemes: readonly CertificationScheme[],
  { priced }: { readonly priced: boolean },
): ItemDraftJudgement {
  const brand = draft.brand.trim();
  const model = draft.model.trim();
  const named: ItemFieldFailure[] = [];
  if (brand === '') named.push({ path: 'brand', issue: 'required' });
  if (model === '') named.push({ path: 'model', issue: 'required' });
  const { spec, failures: specFailed } = specFailures(draft);
  const { certifications, failures: certFailed } = certificationsOf(draft, schemes);
  const failures = [...named, ...specFailed, ...certFailed];
  if (failures.length > 0 || spec === undefined) return { ok: false, failures };
  const price = priced ? draft.price.trim() : '';
  return {
    ok: true,
    body: {
      brand,
      model,
      spec,
      certifications,
      preferred: false,
      ...(price === '' ? {} : { rate: { amount: price } }),
    },
  };
}
