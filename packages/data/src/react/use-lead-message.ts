'use client';
import type { CrmMessageTemplateKey } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useEffect, useState } from 'react';
import { useAction } from './action';
import { useRepositories } from './context';
import { useLeadDetailCache } from './lead-detail-cache';
import { readFailureOf } from './read';

/** Which message to compose: the template, and for a visit confirmation the visit it confirms. */
export interface LeadMessageAsk {
  readonly template: CrmMessageTemplateKey;
  readonly visitId: string | null;
}

/** The message to copy (`M02-33`, `M02-47`): its text as it is composed, and whether it was handed on. */
export interface LeadMessage {
  readonly read: Read<string>;
  /** Copied, or handed to the phone's share sheet: the act says so — and nothing claims delivery. */
  readonly handedOn: boolean;
  markHandedOn(): void;
}

function keyOf(ask: LeadMessageAsk): string {
  return `${ask.template}:${ask.visitId ?? ''}`;
}

/**
 * Composes the tenant's template for this lead once per message asked for: the text comes back
 * ready to paste and the timeline records it was copied. A visit's confirmation is composed once —
 * asking again answers the same text (`M02-48`).
 */
export function useLeadMessage(leadId: string, ask: LeadMessageAsk | null): LeadMessage {
  const repositories = useRepositories();
  const cache = useLeadDetailCache(leadId);
  const [composed, setComposed] = useState<{ key: string; text: string } | null>(null);
  const [handedOn, setHandedOn] = useState<string | null>(null);
  const compose = useAction(
    (asked: LeadMessageAsk) =>
      repositories.leadMessages.compose(leadId, {
        templateKey: asked.template,
        ...(asked.visitId === null ? {} : { visitId: asked.visitId }),
        capturedAt: new Date().toISOString(),
      }),
    {
      onDone: (message, asked) => {
        setComposed({ key: keyOf(asked), text: message.text });
        cache.refresh();
      },
    },
  );
  const askKey = ask === null ? null : keyOf(ask);
  const { run } = compose;

  // biome-ignore lint/correctness/useExhaustiveDependencies: one compose per message asked for — `ask` is read through its key.
  useEffect(() => {
    if (ask !== null && composed?.key !== askKey) void run(ask);
  }, [askKey, run]);

  const read = ((): Read<string> => {
    if (ask === null || askKey === null) return { kind: 'loading' };
    if (composed?.key === askKey) return { kind: 'ready', value: composed.text };
    if (!compose.pending && compose.failure !== null) {
      return {
        kind: 'failed',
        failure: readFailureOf(compose.failure),
        retry: () => void run(ask),
      };
    }
    return { kind: 'loading' };
  })();

  return {
    read,
    handedOn: askKey !== null && handedOn === askKey,
    markHandedOn: () => setHandedOn(askKey),
  };
}
