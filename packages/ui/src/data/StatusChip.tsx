'use client';
import type { CSSProperties } from 'react';
import './StatusChip.css';

export type WorkflowStatus =
  | 'lead'
  | 'survey-scheduled'
  | 'design-in-progress'
  | 'approved'
  | 'installing'
  | 'commissioned'
  | 'on-hold';

/** Default (English) labels — apps pass a translated `label` via Lingui. */
const STATUS_LABEL: Record<WorkflowStatus, string> = {
  lead: 'Lead',
  'survey-scheduled': 'Survey scheduled',
  'design-in-progress': 'Design in progress',
  approved: 'Approved',
  installing: 'Installing',
  commissioned: 'Commissioned',
  'on-hold': 'On hold',
};

/**
 * _adherence allowlist: status, label, density, style.
 * Status is never colour alone — the 6px dot ALWAYS ships with a text label.
 */
export interface StatusChipProps {
  status: WorkflowStatus;
  /** Overrides the built-in label (i18n); the chip always renders text next to the dot. */
  label?: string;
  density?: 'expressive' | 'functional';
  style?: CSSProperties;
}

export function StatusChip({ status, label, density = 'expressive', style }: StatusChipProps) {
  return (
    <span className="ui-status-chip" data-status={status} data-density={density} style={style}>
      <span className="ui-status-chip-dot" aria-hidden />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
