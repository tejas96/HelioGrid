import { ShellGlyph } from '../AppShell';
import { NamedGap } from '../NamedGap';
import type { PlanCardProps } from './PlanCard.types';

/**
 * The plan card's body (web): the headline figure, its line, then each line's values as a short
 * list, a tick before each — what the plan holds read at a glance, its label a quiet line over it.
 */
export function PlanCard({ form, name, figure, gap, note, lines }: PlanCardProps) {
  return (
    <span className="hg-plan-card" data-form={form}>
      {figure === null ? null : (
        <span className="hg-plan-card-price">
          {figure.lead === null ? null : <span className="hg-plan-card-quiet">{figure.lead}</span>}
          <span className="hg-plan-card-figure">{figure.figure}</span>
          {figure.trail === null ? null : (
            <span className="hg-plan-card-quiet">{figure.trail}</span>
          )}
          <span className="hg-plan-card-quiet">{figure.period}</span>
        </span>
      )}
      {gap === null ? null : <NamedGap gap={gap} scale="headline" />}
      {note === null ? null : <span className="hg-plan-card-quiet">{note}</span>}
      {lines.map((line) => (
        <span key={line.key} className="hg-plan-card-group">
          <span className="hg-plan-card-quiet">{line.label}</span>
          <ul className="hg-plan-card-lines" aria-label={name}>
            {line.values.map((value) => (
              <li key={value} className="hg-plan-card-line">
                <ShellGlyph name="tick-small" size="sm" tone="success" />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </span>
      ))}
    </span>
  );
}
