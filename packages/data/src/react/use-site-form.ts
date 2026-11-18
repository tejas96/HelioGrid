'use client';
import type { DesignDetail } from '@heliogrid/contracts';
import {
  DESIGN_MOUNTS,
  type DesignMount,
  type SiteForm,
  type SiteFormEvent,
  type StudioSite,
  SUPPLY_PHASES,
  siteFormOf,
  siteFormStep,
  type UtilityDirectory,
} from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';

interface Draft {
  readonly designId: string;
  /** The form as it opened, or as it was last saved: what `changed` is measured against. */
  readonly opened: SiteForm;
  readonly form: SiteForm;
}

/** The site as domain reads it: a supply phase this build does not know is no phase given. */
function siteOf(site: DesignDetail['site']): StudioSite {
  return {
    ...site,
    supplyPhase: SUPPLY_PHASES.find((phase) => phase === site.supplyPhase) ?? null,
  };
}

/** Where the panels go; a kind a newer server learned opens as a roof, the first of the two. */
function mountOf(mount: string): DesignMount {
  return DESIGN_MOUNTS.find((known) => known === mount) ?? 'roof';
}

/** The facts a save would write, as one comparable text. */
const factsOf = (form: SiteForm): string =>
  JSON.stringify([
    form.name,
    form.mount,
    form.address,
    form.pin,
    form.area,
    form.utilityOperator,
    form.supplyPhase,
    form.sanctionedLoad,
  ]);

export interface SiteFormHeld {
  /** The form, or `null` until the design's first read opened it. */
  readonly form: SiteForm | null;
  /** The form as it stands NOW, read from the hold itself — before any redraw. */
  now(): SiteForm | null;
  /** One step, as domain decides it; answers the form it left, or `null` with no form open. */
  step(event: SiteFormEvent): SiteForm | null;
  /** The save landed: what was SENT is what the site holds — a change made since still stands apart. */
  saved(sent: SiteForm): void;
  /** Drops what was typed: the form is again as it opened, or as it was last saved. */
  discard(): void;
  /** A fact of the form differs from what the site holds. */
  readonly changed: boolean;
}

/**
 * The Site details form over one design. It opens once, from the design's first read — a later
 * re-read never overwrites what a person is typing — and every change is domain's `siteFormStep`.
 */
export function useSiteForm(
  designId: string,
  detail: DesignDetail | undefined,
  directory: UtilityDirectory,
): SiteFormHeld {
  const [draft, setDraft] = useState<Draft | null>(null);
  const latest = useRef(draft);
  latest.current = draft;
  useEffect(() => {
    if (detail === undefined || latest.current?.designId === designId) return;
    const mount = mountOf(detail.design.mount);
    const form = siteFormOf(siteOf(detail.site), mount, detail.subject.customerName);
    setDraft({ designId, opened: form, form });
  }, [detail, designId]);

  const held = (): Draft | null => (latest.current?.designId === designId ? latest.current : null);
  const open = draft?.designId === designId ? draft : null;
  return {
    form: open?.form ?? null,
    now: () => held()?.form ?? null,
    step: (event) => {
      const before = held();
      if (before === null) return null;
      const next = siteFormStep(before.form, event, directory);
      if (next !== before.form) {
        latest.current = { ...before, form: next };
        setDraft(latest.current);
      }
      return next;
    },
    saved: (sent) => {
      const before = held();
      if (before === null) return;
      latest.current = { ...before, opened: sent };
      setDraft(latest.current);
    },
    discard: () => {
      const before = held();
      if (before === null) return;
      latest.current = { ...before, form: before.opened };
      setDraft(latest.current);
    },
    changed: open !== null && factsOf(open.form) !== factsOf(open.opened),
  };
}
