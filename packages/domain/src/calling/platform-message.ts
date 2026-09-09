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
  return packLabel(rules.messaging.templates[kind], language).replace(
    SLOT,
    (slot, name: string) => {
      const value = variables[name];
      if (value === undefined) throw new RangeError(`the ${kind} template needs ${slot}`);
      return value;
    },
  );
}
