'use client';
import type { TrancheCard, TrancheLineRead } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { useTenantId } from './use-tenant-id';

/** A part's share moves in whole percent; the wire spells it with two decimals. */
const percentWire = (percent: number): string => percent.toFixed(2);
const WHOLE = 100;

/**
 * The default payment plan edited inline on Proposal defaults (`T-M01-030`, `d-defaults-payment`):
 * step 7's own rows — a share up or down, a part added or removed, *Reset* — held on the page with
 * its other changes and sent by the page's one *Save*. The plan is the company's tranche template
 * (`M01-54`), so its save goes there; *New plan* keeps opening the Payment terms editor.
 */
export interface DefaultsPlan {
  /** The default plan's parts as the page holds them; `null` while the plans are not read. */
  readonly lines: readonly TrancheLineRead[] | null;
  /** A part was changed here and is not saved yet. */
  readonly changed: boolean;
  share(index: number, percent: number): void;
  remove(index: number): void;
  /** A part due where the last one is, holding what is left of the hundred. */
  add(): void;
  /** Back to the plan as saved. */
  reset(): void;
  readonly saving: boolean;
  /** The last save did not land: the parts are kept and the part says so. */
  readonly failed: boolean;
  /** Sends the changed parts; nothing changed sends nothing. */
  save(): void;
}

export function useDefaultsPlan(
  plan: TrancheCard | null,
  newLabel: (number: number) => string,
): DefaultsPlan {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  /* The edit belongs to the plan it was made on: another plan made the default shows as saved. */
  const [edited, setEdited] = useState<{ id: string; lines: TrancheLineRead[] } | null>(null);
  const held = plan !== null && edited?.id === plan.id ? edited.lines : null;
  const lines = held ?? plan?.lines ?? null;
  const save = useAction(async (sent: { id: string; name: string; lines: TrancheLineRead[] }) => {
    await repositories.settings.saveTrancheTemplate(sent.id, {
      name: sent.name,
      lines: sent.lines.map((line) => ({ ...line })),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.settings.trancheTemplates(tenantId),
    });
    /* Only the edit that was sent is let go: one typed while the save was out stays held. */
    setEdited((was) => (was?.lines === sent.lines ? null : was));
  });
  const change = (next: (was: readonly TrancheLineRead[]) => TrancheLineRead[]) => {
    if (plan === null || lines === null) return;
    setEdited({ id: plan.id, lines: next(lines) });
  };
  return {
    lines,
    changed: held !== null,
    share: (index, percent) =>
      change((was) =>
        was.map((line, at) => (at === index ? { ...line, percent: percentWire(percent) } : line)),
      ),
    remove: (index) => change((was) => was.filter((_, at) => at !== index)),
    add: () =>
      change((was) => {
        const last = was.at(-1);
        if (last === undefined) return [...was];
        const given = was.reduce((sum, line) => sum + Number(line.percent), 0);
        const left = Math.max(0, WHOLE - given);
        return [
          ...was,
          {
            label: newLabel(was.length + 1),
            percent: percentWire(left),
            dueOnStage: last.dueOnStage,
          },
        ];
      }),
    reset: () => setEdited(null),
    saving: save.pending,
    failed: save.failure !== null,
    save: () => {
      if (plan === null || held === null) return;
      void save.run({ id: plan.id, name: plan.name, lines: held });
    },
  };
}
