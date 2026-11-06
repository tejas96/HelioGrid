import { Text } from '../../primitives/Text/Text';
import { Explainer } from '../Explainer/Explainer';
import type { DoorTitleProps } from './DoorFrame.types';

/**
 * The door's title block: the page's `h1`, the large title in the display face, with its ask on the
 * same row, and the intro under it.
 */
export function DoorTitle({ title, explainer, intro }: DoorTitleProps) {
  return (
    <div className="hg-door-title">
      <div className="hg-door-title-row">
        <Text variant="display">{title}</Text>
        {explainer === undefined ? null : <Explainer {...explainer} />}
      </div>
      {intro === undefined ? null : (
        <Text variant="body-lg" color="secondary">
          {intro}
        </Text>
      )}
    </div>
  );
}
