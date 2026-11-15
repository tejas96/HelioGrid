import type { TimelineStepView } from './ProposalSteps.types';
import type { StepControl } from './step-controls';

/**
 * Step 6 (`M06-12`, `T-M06-008`): each phase a row — pressed, it opens the one sheet for its name,
 * sentence and duration — with move up, move down and remove at the touch floor, and no drag.
 */
export function timelineControls(view: TimelineStepView): StepControl[] {
  const { words, phases } = view;
  return [
    {
      kind: 'rows',
      key: 'phases',
      rows: phases.map((phase, index) => ({
        /* A phase has no identity but its place. */
        key: String(index),
        place: index + 1,
        title: phase.name,
        line: words.rowLine(phase),
        open: { label: words.edit(phase.name), onPress: () => view.onEdit(index) },
        items: [
          {
            kind: 'act',
            key: 'up',
            glyph: 'chevron-up',
            label: words.moveUp(phase.name),
            disabled: index === 0,
            leaves: index === 1,
            onPress: () => view.onMove(index, -1),
          },
          {
            kind: 'act',
            key: 'down',
            glyph: 'caret-down',
            label: words.moveDown(phase.name),
            disabled: index === phases.length - 1,
            leaves: index === phases.length - 2,
            onPress: () => view.onMove(index, 1),
          },
          {
            kind: 'act',
            key: 'remove',
            glyph: 'trash',
            label: words.remove(phase.name),
            leaves: true,
            onPress: () => view.onRemove(index),
          },
        ],
      })),
    },
    {
      kind: 'acts',
      key: 'acts',
      acts: [
        { glyph: 'plus', label: words.add, onPress: view.onAdd },
        { glyph: 'retry', label: words.reset, onPress: view.onReset, quiet: true },
      ],
    },
  ];
}
