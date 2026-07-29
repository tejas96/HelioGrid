'use client';
import type { WorkflowStatus } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import './StatusChip.css';

export type { WorkflowStatus };

/**
 * _adherence allowlist: status, label, density, style.
 * Status is never colour alone — the 6px dot ALWAYS ships with a text label.
 *
 * `label` is REQUIRED and identical to the RN mirror (Law 7). It used to be optional with
 * a baked-in English fallback map, which silently shipped untranslated copy whenever a
 * caller forgot it — `packages/ui` is string-free, so the call site translates via Lingui.
 */
export interface StatusChipProps {
  status: WorkflowStatus;
  /** Translated at the call site; the chip always renders text next to the dot. */
  label: string;
  density?: 'expressive' | 'functional';
  style?: CSSProperties;
}

export function StatusChip({ status, label, density = 'expressive', style }: StatusChipProps) {
  return (
    <span className="ui-status-chip" data-status={status} data-density={density} style={style}>
      <span className="ui-status-chip-dot" aria-hidden />
      {label}
    </span>
  );
}
