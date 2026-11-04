import type { EntitlementBlocked, TenantOwners, TranslatedText } from '@heliogrid/contracts';
import type { BillingStripAudience, PackLabel, Read } from '@heliogrid/domain';
import { billingDenialOf } from '../BillingDenial/BillingDenial.logic';
import type { BillingDenialView } from '../BillingDenial/BillingDenial.types';
import type { BillingStripContext, BillingStripFacts } from './BillingStrip.facts';
import { billingStripOf } from './BillingStrip.logic';
import type { BillingStripView, BillingStripWords } from './BillingStrip.types';

/** What the shell's read hands over: the strip's facts, with the method and the owners raw. */
export interface ShellBillingFacts extends Omit<BillingStripFacts, 'methodName' | 'scope'> {
  readonly owners: TenantOwners | null;
}

/** The strip's words, and the two the shell puts into words from the read. */
export interface ShellBillingWords extends BillingStripWords {
  packText(label: PackLabel): TranslatedText;
  scope(owners: TenantOwners | null): TranslatedText | null;
}

export interface ShellBilling {
  /** The slot's read; `null` draws nothing — no condition, no strip, no chip. */
  readonly strip: Exclude<Read<BillingStripView>, { kind: 'empty' }> | null;
  denialOf(blocked: EntitlementBlocked): BillingDenialView;
}

/**
 * The shell's strip and denial (`SCR-SHELL-06`) from the shell's billing read, as both shells draw
 * them (Law 11). Loading holds the slot; a failed read says so with no figure; no condition is
 * nothing at all.
 */
export function shellBillingOf(
  read: Read<ShellBillingFacts>,
  words: ShellBillingWords,
  {
    format,
    now,
    audience,
  }: Omit<BillingStripContext, 'words'> & {
    /** From the session's roles, so a denial before any read answers still offers its route. */
    readonly audience: BillingStripAudience;
  },
): ShellBilling {
  const context = { words, format, now };
  const facts =
    read.kind === 'ready'
      ? {
          ...read.value,
          methodName:
            read.value.home?.method.label === null || read.value.home === null
              ? null
              : words.packText(read.value.home.method.label),
          scope: words.scope(read.value.owners),
        }
      : null;
  return {
    strip: stripRead(read, facts, context),
    denialOf: (blocked) =>
      billingDenialOf(
        blocked,
        facts ?? { audience, home: null, methodName: null, scope: null },
        context,
      ),
  };
}

function stripRead(
  read: Read<ShellBillingFacts>,
  facts: BillingStripFacts | null,
  context: BillingStripContext,
): ShellBilling['strip'] {
  if (read.kind === 'loading' || read.kind === 'failed') return read;
  if (facts === null) return null;
  const strip = billingStripOf(facts, context);
  return strip === null ? null : { kind: 'ready', value: strip };
}
