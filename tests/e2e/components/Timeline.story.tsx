import { Badge, ShellGlyph, Timeline } from '@heliogrid/ui';
import { useState } from 'react';

/** One stage as the spec states it: plain words, so they cross from the test process to the page. */
export interface PickStage {
  id: string;
  label: string;
  description: string;
  /** The words of the stage's *Can be skipped* mark; a stage with it takes the warning node. */
  skippable?: string;
  /** One pill per tranche already due at this stage. */
  due?: string[];
}

/**
 * Design-system change 17 as `SCR-M01-20`'s stage picker draws it: the chain as a radio group,
 * `onChange` bound in the browser. Every pick is written, in order, to the frame's `data-picks`,
 * so a spec reads what the timeline reported, not only what it shows.
 */
export function StagePicker({
  label,
  stages,
  initial,
}: {
  label: string;
  stages: PickStage[];
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  const [picks, setPicks] = useState<string[]>([]);
  return (
    <div data-picks={picks.join(',')}>
      <Timeline
        label={label}
        value={value}
        onChange={(id) => {
          setValue(id);
          setPicks((before) => [...before, id]);
        }}
        density="functional"
        items={stages.map((stage) => ({
          id: stage.id,
          label: stage.label,
          description: stage.description,
          icon: <ShellGlyph name="package" size="sm" />,
          tone: stage.skippable === undefined ? undefined : ('warning' as const),
          marks:
            stage.skippable === undefined ? undefined : (
              <Badge tone="warning" density="functional">
                {stage.skippable}
              </Badge>
            ),
          content: stage.due?.map((pill) => (
            <Badge key={pill} tone="neutral" density="functional">
              {pill}
            </Badge>
          )),
        }))}
      />
    </div>
  );
}
