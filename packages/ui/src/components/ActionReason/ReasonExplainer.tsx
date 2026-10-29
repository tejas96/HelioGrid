/// <reference lib="dom" />
import { useRef } from 'react';
import { Explainer } from '../Explainer/Explainer';
import { INERT_TRIGGER } from '../Explainer/Explainer.logic';
import { reasonPage } from './ActionReason.logic';
import type { ReasonExplainerProps } from './ActionReason.types';

/**
 * A disabled act's reason, opened in the `Explainer` bubble above the host's control (design-system
 * changes 5 and 6). The bubble is clamped inside the nearest `[data-frame]`, else the viewport. The
 * sentence is kept in a visually hidden span under `id` as well, because the bubble's copy exists
 * only while it is open and the control's `aria-describedby` must read it while it is shut.
 */
export function ReasonExplainer({ spec, id, open, block = false, children }: ReasonExplainerProps) {
  const control = useRef<HTMLElement | null>(null);
  const page = reasonPage(spec);
  /* A host mounts this only for a stated reason; with none, its control is drawn and opens nothing. */
  if (page === '') {
    return children({ ...INERT_TRIGGER, describedBy: id });
  }
  return (
    <>
      <Explainer
        className={block ? 'hg-reason-explainer-block' : undefined}
        label={page}
        pages={page}
        placement="top"
        density="functional"
        open={open}
        within={() => control.current?.closest<HTMLElement>('[data-frame]') ?? null}
        trigger={(triggerProps) =>
          children({
            ...triggerProps,
            describedBy: id,
            ref: (node) => {
              control.current = node instanceof HTMLElement ? node : null;
              triggerProps.ref?.(node);
            },
          })
        }
      />
      <span id={id} className="hg-spoken-only">
        {page}
      </span>
    </>
  );
}
