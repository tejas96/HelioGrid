import type { LanguageContentState } from './LanguageSwitcher.types';

interface LanguageStateGlyphProps {
  state: LanguageContentState;
  active: boolean;
}

/**
 * The second channel (F7-12 / N6): a filled mark for authored, `ValueSource`'s layers glyph for
 * inherited — the same mark the per-section line under the Textarea uses, so the strip and the field
 * are speaking about one fact — and a hollow ring for nothing written.
 */
export function LanguageStateGlyph({ state, active }: LanguageStateGlyphProps) {
  if (state === 'inherited') {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="hg-language-switcher-glyph"
        data-state="inherited"
        data-active={active ? 'true' : undefined}
      >
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="m3 14 9 5 9-5" />
      </svg>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="hg-language-switcher-glyph"
      data-state={state}
      data-active={active ? 'true' : undefined}
    />
  );
}
