import type { BillingNotice } from '../commerce/billing-notices';
import type { PackLabel } from '../format/languages';
import { packLabel, type UiLanguage } from '../format/languages';
import type { CallingRulesPack, PlatformMessageKind } from './pack';

/** A slot in a registered template: `{code}`, `{inviter}`, `{company}`, `{link}`. */
const SLOT = /\{(\w+)\}/g;

/**
 * One registered platform template (`PLATFORM_MESSAGE_KINDS`) in the reader's language with every
 * slot filled from `variables`. A slot no variable fills throws: a message with a raw placeholder
 * must never reach a phone, and the mismatch is the caller's bug, not a rendering choice. Replacer
 * functions, not strings, so a value holding `$&` is written verbatim.
 */
export function platformMessage(
  rules: CallingRulesPack,
  kind: PlatformMessageKind,
  language: UiLanguage,
  variables: Readonly<Record<string, string>>,
): string {
  return filled(rules.messaging.templates[kind], kind, language, variables);
}

/**
 * A billing notice's SMS in the reader's language (`M12-40`), slots filled as `platformMessage`
 * fills them. `null` when the market's pack carries no registered text for the notice: its SMS
 * does not go (`F1-38`).
 */
export function billingNoticeMessage(
  rules: CallingRulesPack,
  notice: BillingNotice,
  language: UiLanguage,
  variables: Readonly<Record<string, string>>,
): string | null {
  const registered = rules.messaging.billingNotices?.[notice];
  if (registered === undefined) return null;
  return filled(registered.text, notice, language, variables);
}

function filled(
  template: PackLabel,
  name: string,
  language: UiLanguage,
  variables: Readonly<Record<string, string>>,
): string {
  return packLabel(template, language).replace(SLOT, (slot, key: string) => {
    const value = variables[key];
    if (value === undefined) throw new RangeError(`the ${name} template needs ${slot}`);
    return value;
  });
}
