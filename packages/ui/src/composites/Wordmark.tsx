'use client';
import './Wordmark.css';

/**
 * Composition allowlist: size. Brand wordmark (login.md §2): "Helio" in text-primary,
 * "Grid" filled with --gradient-brand via background-clip — sanctioned
 * iridescence-as-atmosphere. Brand text — never translated.
 */
export interface WordmarkProps {
  /** md = auth/marketing (login.md 22px); sm = compact app-shell contexts. */
  size?: 'md' | 'sm';
}

export function Wordmark({ size = 'md' }: WordmarkProps) {
  return (
    <span className="ui-wordmark" data-size={size} role="img" aria-label="HelioGrid">
      <span aria-hidden="true">Helio</span>
      <span className="ui-wordmark-grid" aria-hidden="true">
        Grid
      </span>
    </span>
  );
}
