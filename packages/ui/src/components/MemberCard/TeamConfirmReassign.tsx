import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import type { TeamConfirmReassignProps } from './MemberCard.types';

/**
 * A deactivation's open leads (`SCR-M01-12`): how many the person holds, and the row that chooses who takes
 * them all. The row names the chosen person once picked; until then the leads stay where they are.
 */
export function TeamConfirmReassign({ read, to, onChoose, words }: TeamConfirmReassignProps) {
  if (read.kind === 'loading') return <LoadingBars bars={['control']} label={words.loading} />;
  if (read.kind === 'failed') {
    return (
      <div className="hg-team-reassign">
        <Text variant="body-sm" color="secondary">
          {words.failed}
        </Text>
        <Button variant="secondary" size="sm" onClick={read.retry}>
          {words.retry}
        </Button>
      </div>
    );
  }
  if (read.kind === 'empty' || read.value === 0) {
    return (
      <Text variant="body-sm" color="secondary">
        {words.none}
      </Text>
    );
  }
  return (
    <div className="hg-team-reassign">
      <Text variant="body-sm" bold>
        {words.holds(read.value)}
      </Text>
      <Pressable className="hg-team-reassign-row" onPress={onChoose}>
        <span className="hg-team-reassign-words">
          <Text as="span" variant="caption" color="secondary">
            {words.moveTo}
          </Text>
          <Text as="span" variant="body" bold>
            {to ?? words.choose}
          </Text>
        </span>
        <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
      </Pressable>
      {to === null ? (
        <Text variant="caption" color="secondary">
          {words.stay}
        </Text>
      ) : null}
    </div>
  );
}
