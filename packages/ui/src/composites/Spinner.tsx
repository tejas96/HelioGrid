'use client';
import './Spinner.css';

/**
 * Composition allowlist: size, tone. Standalone spinner matching the Button-internal
 * one (same ui-spin keyframes; Button itself is untouched). Presentational — the
 * consumer carries the loading semantics (aria-busy / status text), mirroring how
 * Button marks itself aria-busy around its aria-hidden spinner.
 */
export interface SpinnerProps {
  size?: 'md' | 'sm';
  /** onDark = on near-black/accent fills (the Button-primary recipe); neutral = on light surfaces. */
  tone?: 'onDark' | 'neutral';
}

export function Spinner({ size = 'md', tone = 'neutral' }: SpinnerProps) {
  return <span className="ui-spinner" data-size={size} data-tone={tone} aria-hidden="true" />;
}
