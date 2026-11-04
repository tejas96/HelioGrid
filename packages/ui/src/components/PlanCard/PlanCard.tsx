import { FactRow, FactRows } from '../FactRow';
import { NamedGap } from '../NamedGap';
import type { PlanCardProps } from './PlanCard.types';

/** The plan card's body (web): the headline figure, its line, then the one flowing limits line. */
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
      {lines.length === 0 ? null : (
        <FactRows label={name} density="expressive" form="lead">
          {lines.map((line) => (
            <FactRow key={line.key} label={line.label} values={[...line.values]} />
          ))}
        </FactRows>
      )}
    </span>
  );
}
