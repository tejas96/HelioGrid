import type { CSSProperties } from 'react';
import { useId, useSyncExternalStore } from 'react';
import { classNames } from '../../primitives/class-names';
import type { FieldModeHook, FieldModeToggleProps } from './FieldModeToggle.types';
import {
  getFieldMode,
  getServerFieldMode,
  setFieldMode,
  subscribeFieldMode,
} from './field-mode-store';

/**
 * Reads and sets the mode. Subscribes to the shared store, so every mounted caller holds the same
 * answer — there is no per-caller copy to go stale, and a change made in another tab or by writing
 * the `<html>` attribute directly is picked up too.
 */
export function useFieldMode(): FieldModeHook {
  const on = useSyncExternalStore(subscribeFieldMode, getFieldMode, getServerFieldMode);
  return [on, setFieldMode];
}

export { setFieldMode };

interface WebFieldModeToggleProps extends FieldModeToggleProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The switch behind F7-16's high-contrast field mode.
 *
 * IT IS A PRODUCT CAPABILITY, NOT A STYLING VARIANT, with three consequences built in here: it is
 * global (one attribute on `<html>`, not a prop threaded through a tree, because a surveyor turning
 * it on means "I am outside"); it persists (the roof does not stop being sunny between screens); and
 * it is honestly labelled, since a user who cannot find it again has lost the capability.
 *
 * Not a dark theme and not a per-tenant theme: F7-04's light-only law is untouched.
 *
 * The DS composes `Switch` here. `Switch` belongs to another agent's folder in this port, so the
 * track below is local — and it declares `--control-edge` for the same reason `Switch` does: in
 * field mode an OFF track is #E9ECF0 on white, about 1.15:1, and the blanket rule in
 * tokens/field-mode.css keys on control semantics a presentational `<span>` cannot match. The switch
 * you reach for to turn high contrast on must not be the control that gains no edge from it.
 */
export function FieldModeToggle({
  label = 'High-contrast field mode',
  hint = 'Darker text, and a visible edge on every card, row, field and control. For reading the screen in direct sunlight.',
  className,
  style,
}: WebFieldModeToggleProps) {
  const [on, setOn] = useFieldMode();
  const sid = useId();
  return (
    <div className={classNames('hg-field-mode', className)} style={style}>
      <label className="hg-field-mode-row" htmlFor={sid} data-checked={on ? 'true' : undefined}>
        <span className="hg-field-mode-track">
          <span className="hg-field-mode-thumb" />
        </span>
        <input
          className="hg-field-mode-input"
          id={sid}
          type="checkbox"
          role="switch"
          checked={on}
          aria-checked={on}
          onChange={(event) => setOn(event.target.checked)}
        />
        <span className="hg-field-mode-label">{label}</span>
      </label>
      {hint === undefined ? null : <p className="hg-field-mode-hint">{hint}</p>}
    </div>
  );
}

FieldModeToggle.useFieldMode = useFieldMode;
/** Set it without the switch — a settings screen, a deep link, a QA harness. */
FieldModeToggle.set = setFieldMode;
