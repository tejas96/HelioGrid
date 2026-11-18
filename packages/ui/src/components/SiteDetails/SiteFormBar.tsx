import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { PendingAction } from '../PendingAction/PendingAction';
import { barLineOf, type SiteFormBarProps } from './SiteDetails.logic';

/**
 * The one bar at the foot of the form, in view while the form scrolls: why the design cannot start
 * yet or what comes next, then the way out — where the room is wide — and *Start design*. A save
 * that came back undone is said here, where the person pressed.
 */
export function SiteFormBar({ room, form, saving, failure, acts, words }: SiteFormBarProps) {
  const wide = room === 'wide';
  return (
    <div className="hg-site-bar" data-room={room}>
      <div className="hg-site-bar-in">
        {failure === null ? null : <PendingAction state="returned" reason={failure} />}
        <div className="hg-site-bar-row">
          <Text variant="body-sm" color="secondary" className="hg-site-bar-line">
            {barLineOf(form, words)}
          </Text>
          {wide ? (
            <Button variant="ghost" size="lg" disabled={saving} onClick={acts.onCancel}>
              {words.cancel}
            </Button>
          ) : null}
          <Button
            variant="primary"
            size="lg"
            fullWidth={!wide}
            disabled={form.pin === null}
            loading={saving}
            iconRight={<ShellGlyph name="arrow-right" size="md" tone="inverse" />}
            onClick={acts.onStart}
          >
            {words.start}
          </Button>
        </div>
      </div>
    </div>
  );
}
