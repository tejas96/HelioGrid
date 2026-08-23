import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import type { SwitchProps } from './Switch.types';

interface WebSwitchProps extends SwitchProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * 52x32 switch, spring thumb. Track `--canvas-sunken` when off, `--accent` when on.
 *
 * A switch can be the reason a send refused, so it takes `error`. The sentence CANNOT live inside
 * the `<label>` — clicking it would toggle the switch — so with an error the whole thing renders
 * inside a column wrapper, the track takes a danger ring, and `style` lands on the wrapper.
 * Without one, the markup is exactly what it was.
 */
export function Switch({
  checked = false,
  onChange,
  label,
  error,
  disabled = false,
  id,
  className,
  style,
}: WebSwitchProps) {
  const autoId = useId();
  const sid = id ?? autoId;
  const errId = `${sid}-err`;
  const hasError = error !== undefined && error !== null && error !== false;
  /* The track is 52x32 and the target is 44 tall — the <label> is the hit box, because the real
     control is the visually hidden input. */
  const control = (
    <label
      className={classNames('hg-switch', hasError ? undefined : className)}
      data-checked={checked}
      data-disabled={disabled}
      data-error={hasError}
      htmlFor={sid}
      style={hasError ? undefined : style}
    >
      <span className="hg-switch-track">
        <span className="hg-switch-thumb" />
      </span>
      <input
        className="hg-switch-input"
        id={sid}
        type="checkbox"
        role="switch"
        checked={checked}
        aria-checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={disabled}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={hasError ? errId : undefined}
      />
      {label !== undefined ? <span className="hg-switch-label">{label}</span> : null}
    </label>
  );
  if (!hasError) {
    return control;
  }
  return (
    <div className={classNames('hg-switch-wrap', className)} style={style}>
      {control}
      <span className="hg-switch-error" id={errId}>
        {error}
      </span>
    </div>
  );
}
