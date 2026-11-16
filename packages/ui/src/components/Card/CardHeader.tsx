import type { Ref } from 'react';
import { classNames } from '../../primitives/class-names';
import type { CardHeaderProps } from './Card.types';

interface WebCardHeaderProps extends CardHeaderProps {
  /** Where focus lands when one of the card's acts leaves after its press. */
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
}

/** A card's head: its title, the quiet line under it, its one act at the end. */
export function CardHeader({
  title,
  description = null,
  action = null,
  lead = null,
  level = 2,
  face = 'sans',
  headingRef,
  className,
}: WebCardHeaderProps) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <header className={classNames('hg-card-header', className)}>
      {lead === null ? null : <span className="hg-card-header-lead">{lead}</span>}
      <span className="hg-card-header-words">
        <Heading
          ref={headingRef}
          tabIndex={headingRef === undefined ? undefined : -1}
          className="hg-card-header-title hg-focus-target"
          data-face={face}
        >
          {title}
        </Heading>
        {description === null ? null : (
          <span className="hg-card-header-description">{description}</span>
        )}
      </span>
      {action === null ? null : <span className="hg-card-header-action">{action}</span>}
    </header>
  );
}
