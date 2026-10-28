/* Timeline's pick mode (web) — the chain as a radio group, `SCR-M01-20`'s stage picker. One step
   is in the tab order (the chosen one, else the first); the arrow keys move AND choose, Enter and
   Space choose, and Tab leaves the group. The rail is neutral: nothing is done or current here, so
   nothing is lit. */

import type { CSSProperties, KeyboardEvent } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { isTabStop, movedIndex, pickedIndex, pickMove } from './Timeline.pick';
import type { TimelineDensity, TimelineItem } from './Timeline.types';
import { TimelinePickStep } from './TimelinePickStep';

export function TimelinePick({
  items,
  value,
  onChange,
  label,
  density,
  className,
  style,
}: {
  items: TimelineItem[];
  value: string | undefined;
  onChange: (id: string) => void;
  label: string | undefined;
  density: TimelineDensity;
  className?: string;
  style?: CSSProperties;
}) {
  const steps = useRef<Array<HTMLButtonElement | null>>([]);
  const picked = pickedIndex(items, value);

  const choose = (index: number) => {
    const id = items[index]?.id;
    if (id !== undefined) onChange(id);
    steps.current[index]?.focus();
  };

  const onKey = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const move = pickMove(event.key);
    if (move === undefined) return;
    event.preventDefault();
    choose(movedIndex(index, move, items.length));
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={classNames('hg-timeline-pick', className)}
      data-density={density}
      style={style}
    >
      {items.map((item, index) => (
        <TimelinePickStep
          key={item.id ?? `${index}-${item.label}`}
          item={item}
          checked={index === picked}
          tabStop={isTabStop(index, picked)}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          stepRef={(element) => {
            steps.current[index] = element;
          }}
          onChoose={() => choose(index)}
          onKeyDown={(event) => onKey(index, event)}
        />
      ))}
    </div>
  );
}
