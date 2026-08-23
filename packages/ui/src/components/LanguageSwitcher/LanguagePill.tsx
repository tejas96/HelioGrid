import type { KeyboardEvent, Ref } from 'react';
import { LanguageStateGlyph } from './LanguageStateGlyph';
import type { AgentLanguage } from './LanguageSwitcher.types';
import { spokenName, stateOf } from './language-state';

export interface LanguagePillProps {
  lang: AgentLanguage;
  active: boolean;
  total: number | null;
  sectionNoun: string;
  fallbackName: string;
  showCounts: boolean;
  /** The strip's roving tabindex — one stop for the whole one-of-N set. Web only; touch has none. */
  tabIndex: number;
  pillRef: Ref<HTMLButtonElement>;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onPress: (code: string) => void;
}

/**
 * One language: the NAME, a per-state GLYPH and a FRACTION — none of the three is a colour.
 *
 * The pill lives in its own file on BOTH halves so the two semantics it carries are declared in one
 * place per platform: `tab` inside the strip's `tablist`, and the chosen one said rather than
 * tinted. The 44px target wraps the 34px pill.
 */
export function LanguagePill({
  lang,
  active,
  total,
  sectionNoun,
  fallbackName,
  showCounts,
  tabIndex,
  pillRef,
  onKeyDown,
  onPress,
}: LanguagePillProps) {
  const state = stateOf(lang, total);
  const fraction =
    showCounts && total !== null && lang.written !== undefined ? `${lang.written}/${total}` : null;
  return (
    <button
      ref={pillRef}
      type="button"
      /* ONE-OF-N BY CONSTRUCTION, so each language is a `tab` inside the strip's `tablist` — the
         same two roles the native half spells. */
      role="tab"
      /* WHICH LANGUAGE IS CHOSEN, said rather than tinted (F7-12): the accent pill is the sighted
         channel and this is the spoken one. `accessibilityState.selected` on native. */
      aria-selected={active}
      aria-label={spokenName(lang, total, sectionNoun, fallbackName, fraction !== null)}
      tabIndex={tabIndex}
      className="hg-language-switcher-target"
      onKeyDown={onKeyDown}
      onClick={() => onPress(lang.code)}
    >
      <span className="hg-language-switcher-pill" data-active={active ? 'true' : undefined}>
        <LanguageStateGlyph state={state} active={active} />
        {lang.label}
        {lang.primary === true ? (
          <span className="hg-language-switcher-primary">primary</span>
        ) : null}
        {fraction === null ? null : (
          <span className="hg-language-switcher-fraction" data-state={state}>
            {fraction}
          </span>
        )}
      </span>
    </button>
  );
}
