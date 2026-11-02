import type { PlanChangePreview, PlanPick } from '@heliogrid/contracts';
import { focusManager, type QueryClient, type QueryKey } from '@tanstack/react-query';
import type { Repositories } from '../data-layer';
import { ApiError } from '../errors/errors';

/**
 * Why the plans' act did not land (`F7-23` N10): the gateway refused or did not answer, the row
 * cannot change this way (`PLAN_CHANGE_NOT_POSSIBLE`, `TIER_NOT_SOLD`), the usage moved under the
 * preview (`M12-49`) — which the screen answers by reading it again — or anything else.
 */
export type PlanActFailure =
  | 'gateway_down'
  | 'not_possible'
  | 'not_sold'
  | 'preview_changed'
  | 'other';

/** What a confirmed pick came to: the provider's page to open, or the plan moved or scheduled. */
export type PlanLanded =
  | { readonly kind: 'page'; readonly url: string }
  | { readonly kind: 'applied' }
  | { readonly kind: 'scheduled' };

/**
 * The one act a review confirms: a conversion goes through checkout (`M12-54`), every live row's
 * change through the plan-change route on the preview it was read on.
 */
export async function planConfirmOf(
  repositories: Repositories,
  pick: PlanPick,
  preview: PlanChangePreview,
): Promise<PlanLanded> {
  if (preview.kind === 'conversion') {
    return { kind: 'page', url: await repositories.billing.checkout(pick) };
  }
  const outcome = await repositories.billing.planChange({ ...pick, previewDigest: preview.digest });
  if (outcome.outcome === 'page') return { kind: 'page', url: outcome.checkoutUrl };
  return { kind: outcome.outcome };
}

/** A failure as the screen says it. */
export function planActFailureOf(error: unknown): PlanActFailure {
  if (!(error instanceof ApiError)) return 'other';
  switch (error.code) {
    case 'GATEWAY_UNAVAILABLE':
      return 'gateway_down';
    case 'PLAN_CHANGE_PREVIEW_CHANGED':
      return 'preview_changed';
    case 'PLAN_CHANGE_NOT_POSSIBLE':
      return 'not_possible';
    case 'TIER_NOT_SOLD':
      return 'not_sold';
    default:
      return 'other';
  }
}

/**
 * Reads `key` again once the person comes back from the provider's page — the tab or the app
 * left, then regained, focus (web `visibilitychange`; phone `AppState` through
 * `followHostLifecycle`) — never before, when the payment cannot have landed. Returns the stop.
 */
export function refreshOnReturn(client: QueryClient, key: QueryKey): () => void {
  let left = false;
  const stop = focusManager.subscribe((focused) => {
    if (!focused) {
      left = true;
      return;
    }
    if (!left) return;
    stop();
    void client.invalidateQueries({ queryKey: key });
  });
  return stop;
}
