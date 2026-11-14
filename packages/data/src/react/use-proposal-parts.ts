'use client';
import type { ComponentLineWire, ProposalFieldSetWire } from '@heliogrid/contracts';
import {
  type ComponentCategory,
  type ComponentLine,
  isSavedPartKind,
  mapRead,
  PROPOSAL_LIMITS,
  type Read,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import type { PartChoice } from './proposal-builder-model';
import {
  catalogOffer,
  choicesOf,
  keyOfLine,
  type NewPart,
  type Offer,
  type PartLabels,
  savedOffer,
  typedLine,
} from './proposal-part-offers';
import { readOf } from './read';
import {
  refusedPartFields,
  type SavedPartFailure,
  type SavedPartField,
  useSavedParts,
} from './use-saved-parts';
import { useTenantId } from './use-tenant-id';

type Line = ComponentLineWire;
type Wire = ProposalFieldSetWire;
type Change = (stored: Wire['components'], all: Wire) => Wire['components'];

/** How many catalog brands one picker asks for: a search narrows past it. */
const PICKER_LIMIT = 50;
const MAX = PROPOSAL_LIMITS.brandsPerCategory;

/**
 * Step 8's picker (`M06-27`, `M06-28`, `T-M06-010`): one kind's brands — the resolved catalog for
 * panels, inverters and batteries, the company's saved parts for cable, electrical and structure —
 * with the ones this proposal holds ticked, up to three a kind. Every change is one commit of the
 * whole components step.
 */
export interface ProposalParts {
  /** The kind whose picker stands open. */
  readonly category: ComponentCategory | null;
  open(category: ComponentCategory): void;
  close(): void;
  readonly search: string;
  setSearch(search: string): void;
  readonly choices: Read<readonly PartChoice[]>;
  /** The company's saved parts of this kind run past the first page: *Show more* reads the next. */
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  loadMore(): void;
  /** The kind holds three brands: a fourth is refused, in words (`M06-27`). */
  readonly full: boolean;
  toggle(key: string): void;
  /** The line the edit sheet shows; `null` while it is shut. */
  readonly editing: Line | null;
  edit(key: string): void;
  /** *Done*: what prints for this brand, on this proposal alone (`M06-29`). */
  saveEdit(line: ComponentLine): void;
  closeEdit(): void;
  readonly adding: boolean;
  openAdd(): void;
  closeAdd(): void;
  /** Saves the part — to the company's list where its kind is kept there — and picks it in place. */
  add(part: NewPart): void;
  readonly addPending: boolean;
  readonly addFailed: boolean;
  /** Why the last add was not taken: the fields it names, each said there, and the failure itself. */
  readonly addRefusal: {
    readonly fields: readonly SavedPartField[];
    readonly failure: SavedPartFailure;
  } | null;
  /**
   * The kind whose new part is a catalog ITEM — a panel, an inverter, a battery (`M06-28`): the app
   * then opens the catalog's own add form in place of the small sheet. `null` for a kind kept on
   * the company's saved parts list, and while no picker is open.
   */
  readonly catalogKind: 'panel' | 'inverter' | 'battery' | null;
  /** The catalog item just added there is picked in place, once the picker has read it (`M06-28`). */
  pickAdded(itemId: string): void;
  /**
   * The catalog's spreadsheet import, opened over step 8 from the add form (`M06-28`): the person
   * never leaves the builder, and once it closes the picker reads the catalog again, so what the
   * import made is offered at once. Only a holder of the catalog grant outright is offered it.
   */
  readonly importing: boolean;
  openImport(): void;
  closeImport(): void;
}

export interface PartsDeps {
  readonly fields: Wire | null;
  readonly commit: (change: Change) => void;
  readonly labels: PartLabels;
}

/** One kind's offers: the company's saved parts, or the resolved catalog narrowed by the search. */
function useOffers(category: ComponentCategory | null, search: string, labels: PartLabels) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const savedKind = category !== null && isSavedPartKind(category) ? category : null;
  const saved = useSavedParts(savedKind);
  const q = search.trim();
  const ask = {
    page: 1,
    limit: PICKER_LIMIT,
    kinds: category ?? '',
    ...(q === '' ? {} : { q }),
  };
  const catalog = useQuery({
    queryKey: queryKeys.catalog.items(tenantId, { ...ask, mode: 'picker' }),
    queryFn: ({ signal }) => repositories.catalog.items(ask, signal),
    enabled: tenantId !== '' && category !== null && savedKind === null,
  });
  const offers: Read<readonly Offer[]> =
    savedKind === null
      ? mapRead(readOf(catalog), (page) =>
          page.items.flatMap((item) => catalogOffer(item, labels) ?? []),
        )
      : mapRead(saved.read, (parts) =>
          parts
            .filter((part) => part.brand.toLowerCase().includes(q.toLowerCase()))
            .map((part) => savedOffer(part, savedKind)),
        );
  return { offers, saved, savedKind };
}

const inKindOf = (stored: Wire['components'], category: ComponentCategory | null) =>
  stored.filter((line) => line.category === category);

export function useProposalParts({ fields, commit, labels }: PartsDeps): ProposalParts {
  const [category, setCategory] = useState<ComponentCategory | null>(null);
  const [search, setSearch] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const client = useQueryClient();
  const tenantId = useTenantId();
  const { offers, saved, savedKind } = useOffers(category, search, labels);
  const held = (fields?.components ?? []).filter((line) => line.category === category);
  const offered = offers.kind === 'ready' ? offers.value : [];
  const settled = offers.kind === 'ready' || offers.kind === 'empty';
  const inKind = (stored: Wire['components']) =>
    stored.filter((line) => line.category === category);

  const toggle = (key: string) => {
    const offer = offered.find((one) => one.key === key);
    commit((stored, all) => {
      const mine = inKind(stored);
      if (mine.some((line) => keyOfLine(line) === key)) {
        return stored.filter((line) => line.category !== category || keyOfLine(line) !== key);
      }
      if (offer === undefined || mine.length >= MAX) return stored;
      return [...stored, offer.asLine(all.system.capacityKw)];
    });
  };

  /* A saved part just added is picked in place, once (`M06-28`). */
  const pickedAdd = useRef<string | null>(null);
  const added = saved.added;
  useEffect(() => {
    if (added === null || savedKind === null || pickedAdd.current === added.id) return;
    pickedAdd.current = added.id;
    const line = savedOffer(added, savedKind).asLine(null);
    commit((stored) =>
      stored.filter((one) => one.category === savedKind).length >= MAX ? stored : [...stored, line],
    );
    setAdding(false);
  }, [added, savedKind, commit]);

  /* A catalog item just added is picked in place once the picker's read holds it (`M06-28`). */
  const [wanted, setWanted] = useState<string | null>(null);
  const arrived = wanted === null ? undefined : offered.find((offer) => offer.key === wanted);
  useEffect(() => {
    if (arrived === undefined) return;
    setWanted(null);
    commit((stored, all) =>
      inKindOf(stored, category).length >= MAX ||
      stored.some((line) => keyOfLine(line) === arrived.key)
        ? stored
        : [...stored, arrived.asLine(all.system.capacityKw)],
    );
  }, [arrived, category, commit]);

  const add = (part: NewPart) => {
    if (category === null) return;
    if (savedKind !== null) {
      const warranty = part.warranty.trim() === '' ? null : part.warranty.trim();
      saved.add({
        kind: savedKind,
        brand: part.brand.trim(),
        specification: part.specification.trim(),
        warranty,
        description: null,
      });
      return;
    }
    if (category !== 'panel' && category !== 'inverter' && category !== 'battery') return;
    const line = typedLine(category, part);
    commit((stored) => (inKind(stored).length >= MAX ? stored : [...stored, line]));
    setAdding(false);
  };

  return {
    category,
    hasMore: savedKind !== null && saved.hasMore,
    loadingMore: savedKind !== null && saved.loadingMore,
    loadMore: saved.loadMore,
    open: (next) => {
      setSearch('');
      saved.clear();
      setCategory(next);
    },
    close: () => setCategory(null),
    search,
    setSearch,
    choices: settled ? { kind: 'ready', value: choicesOf(offered, held) } : offers,
    full: held.length >= MAX,
    toggle,
    editing: editKey === null ? null : (held.find((line) => keyOfLine(line) === editKey) ?? null),
    edit: setEditKey,
    saveEdit: (edited) => {
      const key = editKey;
      const line: Line = { ...edited, certifications: [...edited.certifications] };
      commit((stored) =>
        stored.map((one) =>
          one.category === line.category && keyOfLine(one) === key ? line : one,
        ),
      );
      setEditKey(null);
    },
    closeEdit: () => setEditKey(null),
    adding,
    openAdd: () => setAdding(true),
    closeAdd: () => setAdding(false),
    add,
    catalogKind:
      category === 'panel' || category === 'inverter' || category === 'battery' ? category : null,
    pickAdded: (itemId) => {
      setAdding(false);
      setWanted(`catalog:${itemId}`);
    },
    addPending: saved.adding,
    addFailed: saved.failure !== null,
    addRefusal:
      saved.failure === null
        ? null
        : { fields: refusedPartFields(saved.failure), failure: saved.failure },
    importing,
    openImport: () => {
      setAdding(false);
      setImporting(true);
    },
    closeImport: () => {
      setImporting(false);
      void client.invalidateQueries({ queryKey: queryKeys.catalog.all(tenantId) });
    },
  };
}
