import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import type { DoorSwitchProps } from './DoorSwitch.types';

/** The switch decision as the task column's content, not an overlay. */
export function DoorSwitch({ words, onConfirm }: DoorSwitchProps) {
  return (
    <section className="hg-door-switch" aria-live="assertive">
      <div className="hg-door-switch-head">
        <span className="hg-door-switch-mark">
          <ShellGlyph name="alert" size="md" tone="current" />
        </span>
        <Text variant="h3" align="center">
          {words.title}
        </Text>
        <Text variant="body-sm" color="secondary" align="center">
          {words.subtitle}
        </Text>
      </div>
      <div className="hg-door-switch-actions">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled
          disabledReason={words.uploadReason}
        >
          {words.upload}
        </Button>
        <Button variant="destructive" size="lg" fullWidth onClick={onConfirm}>
          {words.confirm}
        </Button>
      </div>
    </section>
  );
}
