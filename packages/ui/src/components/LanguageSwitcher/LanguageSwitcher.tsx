import type { CSSProperties, KeyboardEvent } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { LanguagePill } from './LanguagePill';
import type { LanguageSwitcherProps } from './LanguageSwitcher.types';
import { selectedSentence, summaryLine, totalOf } from './language-state';

interface WebLanguageSwitcherProps extends LanguageSwitcherProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * WHICH LANGUAGES ARE ACTUALLY WRITTEN, on the switcher itself (`SCR-M07-09`'s `language-fallback`).
 *
 * Each item carries three things and none of them is a colour (F7-12 / N6): the language's NAME, a
 * FRACTION (5/8) that turns 48 invisible cells into a legible shape, and a per-state GLYPH. The
 * selected language then gets a full SENTENCE under the strip, because a fraction says how much and
 * only words say what. Every item's accessible name spells the same sentence out.
 *
 * ONE-OF-N BY CONSTRUCTION, so it follows FilterChips exactly: `role="tablist"`, `aria-selected`, a
 * roving tabindex, and arrow keys that SELECT AS THEY MOVE — in a one-of-N strip moving the
 * highlight IS choosing. Each 44px target wraps a 34px pill.
 */
export function LanguageSwitcher({
  words,
  languages = [],
  value,
  onChange,
  sections,
  sectionNoun,
  languageNoun,
  label,
  labelHidden = false,
  summary,
  showCounts = true,
  density = 'expressive',
  className,
  style,
}: WebLanguageSwitcherProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const primary = languages.find((l) => l.primary === true) ?? languages[0];
  const idx = Math.max(
    0,
    languages.findIndex((l) => l.code === value),
  );
  const total = totalOf(languages, sections);
  const fallbackName = primary?.label ?? '';
  const headline = summary ?? summaryLine(languages, total, words, { sectionNoun, languageNoun });

  const onKey = (i: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const go = (n: number) => {
      event.preventDefault();
      const t = (n + languages.length) % languages.length;
      refs.current[t]?.focus();
      const next = languages[t];
      if (next !== undefined) {
        onChange?.(next.code);
      }
    };
    if (event.key === 'ArrowRight') {
      go(i + 1);
    } else if (event.key === 'ArrowLeft') {
      go(i - 1);
    } else if (event.key === 'Home') {
      go(0);
    } else if (event.key === 'End') {
      go(languages.length - 1);
    }
  };

  return (
    <div className={classNames('hg-language-switcher', className)} style={style}>
      {/* No head row around absent content: a hidden label with an empty summary draws none. */}
      {labelHidden && headline === '' ? null : (
        <div className="hg-language-switcher-head">
          {labelHidden ? null : <p className="hg-language-switcher-overline">{label}</p>}
          {headline === '' ? null : <p className="hg-language-switcher-summary">{headline}</p>}
        </div>
      )}

      <div
        className="hg-language-switcher-strip"
        data-density={density}
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
      >
        {languages.map((lang, i) => (
          <LanguagePill
            key={lang.code}
            lang={lang}
            active={lang.code === value}
            total={total}
            words={words}
            nouns={{ sectionNoun, languageNoun, fallbackName }}
            showCounts={showCounts}
            tabIndex={i === idx ? 0 : -1}
            pillRef={(el) => {
              refs.current[i] = el;
            }}
            onKeyDown={(event) => onKey(i, event)}
            onPress={(code) => onChange?.(code)}
          />
        ))}
      </div>

      <p className="hg-language-switcher-sentence" aria-live="polite">
        {selectedSentence(languages[idx], total, words, {
          sectionNoun,
          languageNoun,
          fallbackName,
        })}
      </p>
    </div>
  );
}
