'use client';
import type { CatalogItemWire } from '@heliogrid/contracts';
import {
  blankItemDraft,
  type ComponentKind,
  declaredSchemesOf,
  draftIsDirty,
  type ItemDraft,
  type ItemDraftEvent,
  type ItemFieldFailure,
  itemDraftAfter,
  itemDraftFrom,
  judgeItemDraft,
  type OwnItemCreateBody,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { companyRead } from './shell-reads';
import { useTenantId } from './use-tenant-id';

export interface AddCatalogItemOptions {
  /** The kind the caller is picking; Catalog settings opens on a panel. */
  readonly kind: ComponentKind;
  /** *Enter specs manually* from a selected item (`M01-39`): its id, read for the pre-fill. */
  readonly fromItemId?: string | null;
  /** The person may write a price (`F2.M01.manage-catalog` outright): only then is a rate sent. */
  readonly priced: boolean;
  readonly onAdded: (item: CatalogItemWire) => void;
  /** The sheet closes: a clean draft at once, a dirty one after the discard confirm. */
  readonly onClose: () => void;
  /** *Add many at once from a spreadsheet*: offered only to a person who may price (`M01-39`). */
  readonly onSpreadsheet: () => void;
}

type Opened = { readonly draft: ItemDraft; readonly opened: ItemDraft };

function opened(state: Opened, event: ItemDraftEvent | { type: 'open'; draft: ItemDraft }) {
  if (event.type === 'open') return { draft: event.draft, opened: event.draft };
  return { ...state, draft: itemDraftAfter(state.draft, event) };
}

/** The body paths a drawn field reads: a refusal at any other path is the returned line. */
const DRAWN = /^(brand|model|rate\.amount|spec\..+|certifications\.[^.]+)$/u;

/**
 * A 400 or 422 names its fields; each is said under its field, as the device's judge says it. The
 * route names a certification by its place in the sent list (`certifications.0.reference`), the
 * form by its scheme, so the place is read back through the body that was sent.
 */
function failuresOf(error: unknown, sent: OwnItemCreateBody): readonly ItemFieldFailure[] | null {
  if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 422)) return null;
  const paths = (error.details ?? []).map(({ path }) => {
    const claim = /^certifications\.(\d+)(?:\.|$)/u.exec(path);
    const scheme = claim === null ? undefined : sent.certifications[Number(claim[1])]?.scheme;
    return scheme === undefined ? path : `certifications.${scheme}`;
  });
  const drawn = paths.filter((path) => DRAWN.test(path));
  return drawn.length === 0 ? null : drawn.map((path) => ({ path, issue: 'invalid' as const }));
}

/**
 * The add sheet's write (`SCR-M01-16`): the draft, the market's schemes with their evidence, the
 * pre-fill read, and one keyed create. A second press while one is out sends nothing; a failed
 * send keeps every typed value and its key, so *Try again* makes one item.
 */
export function useAddCatalogItem(options: AddCatalogItemOptions) {
  const { kind, priced, onAdded, onClose, onSpreadsheet } = options;
  const fromItemId = options.fromItemId ?? null;
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const client = useQueryClient();
  const reading = tenantId !== '';

  const company = useQuery(companyRead(repositories, tenantId, reading));
  const marketCode = company.data?.marketCode;
  const pack = useQuery({
    queryKey: queryKeys.market.pack(marketCode ?? ''),
    queryFn: ({ signal }) => repositories.market.currentPack(marketCode ?? '', signal),
    enabled: marketCode !== undefined,
  });
  const selected = useQuery({
    queryKey: [...queryKeys.catalog.all(tenantId), 'item', fromItemId],
    queryFn: ({ signal }) => repositories.catalog.item(fromItemId ?? '', signal),
    enabled: reading && fromItemId !== null,
  });

  const [state, dispatch] = useReducer(opened, kind, (first) => {
    const draft = blankItemDraft(first);
    return { draft, opened: draft };
  });
  const filled = useRef(false);
  useEffect(() => {
    if (filled.current || selected.data === undefined) return;
    filled.current = true;
    dispatch({ type: 'open', draft: itemDraftFrom(selected.data) });
  }, [selected.data]);

  const schemes = useMemo(
    () => declaredSchemesOf(pack.data?.certificationSchemes) ?? [],
    [pack.data],
  );
  const [failures, setFailures] = useState<readonly ItemFieldFailure[]>([]);
  const [saving, setSaving] = useState(false);
  const [returned, setReturned] = useState(false);
  const [confirming, setConfirming] = useState(false);
  /** Counts the refused sends: each lands focus on the first field it names. */
  const [refusal, setRefusal] = useState(0);
  const inFlight = useRef(false);

  const submit = useCallback(async () => {
    if (inFlight.current) return;
    const judged = judgeItemDraft(state.draft, schemes, { priced });
    if (!judged.ok) {
      setFailures(judged.failures);
      setRefusal((count) => count + 1);
      return;
    }
    inFlight.current = true;
    setFailures([]);
    setReturned(false);
    setSaving(true);
    try {
      const item = await repositories.catalog.createItem(judged.body);
      await client.invalidateQueries({ queryKey: queryKeys.catalog.all(tenantId) });
      onAdded(item);
    } catch (error) {
      const fields = failuresOf(error, judged.body);
      if (fields === null) setReturned(true);
      else {
        setFailures(fields);
        setRefusal((count) => count + 1);
      }
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, [state.draft, schemes, priced, repositories, client, tenantId, onAdded]);

  const change = useCallback((event: ItemDraftEvent) => dispatch(event), []);
  const dismissReturned = useCallback(() => setReturned(false), []);
  const dirty = draftIsDirty(state.draft, state.opened);
  /** Cancel, close, Esc or the backdrop: nothing typed leaves at once; anything typed asks first. */
  const cancel = useCallback(() => {
    /* A create that is out may land: leaving now would say nothing was created when it was. */
    if (inFlight.current) return;
    if (dirty) setConfirming(true);
    else onClose();
  }, [dirty, onClose]);
  const keep = useCallback(() => setConfirming(false), []);

  const loading = fromItemId !== null && selected.data === undefined && !selected.isError;
  return {
    /** The selected item's name, for *Filled in from …*; `null` for a fresh form. */
    copiedFrom: selected.data ? `${selected.data.brand} ${selected.data.model}` : null,
    failures,
    /** The confirm is open, and each way in and out of the sheet, as the add sheet names them. */
    confirming,
    form: {
      draft: state.draft,
      refusal,
      onSpreadsheet: priced ? onSpreadsheet : null,
      schemes,
      /** The pre-fill is being read: the spec block is its placeholder. */
      loading,
      saving,
      returned,
      confirmingDiscard: confirming,
      onChange: change,
      onSubmit: () => void submit(),
      onCancel: cancel,
      onRetry: () => void submit(),
      onDismissReturned: dismissReturned,
      onKeep: keep,
      /** *Discard*: nothing was created, so the sheet closes. */
      onDiscard: onClose,
    },
    submit,
  };
}
