import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import type { FormActionBarProps } from './FormActionBar.types';

type WebFormActionBarProps = FormActionBarProps & {
  className?: string;
};

/**
 * The act bar a settings form raises with a change. The consequence reads first, then Save, then
 * Discard, at both placements; only the container differs (`FormActionBar.css`). It shows and
 * hides at once — nothing animates it in. The web band clears the device's bottom inset itself
 * (`env(safe-area-inset-bottom)`).
 */
export function FormActionBar({
  consequence,
  saveLabel,
  onSave,
  discardLabel,
  onDiscard,
  saving = false,
  placement = 'sticky',
  align = 'start',
  className,
}: WebFormActionBarProps) {
  return (
    <div
      className={classNames('hg-form-action-bar', className)}
      data-placement={placement}
      data-align={align}
    >
      {consequence === undefined || consequence === null ? null : (
        <Text
          variant="caption"
          color="secondary"
          align={align}
          className="hg-form-action-bar-consequence"
        >
          {consequence}
        </Text>
      )}
      <div className="hg-form-action-bar-acts">
        <Button variant="primary" size="md" loading={saving} onClick={onSave}>
          {saveLabel}
        </Button>
        <Button variant="ghost" size="md" disabled={saving} onClick={onDiscard}>
          {discardLabel}
        </Button>
      </div>
    </div>
  );
}
