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
 *
 * A `description` is the opposite case: it lives inside the `<label>` so a click on it throws the
 * switch. The `<label>` would then name the input with both lines, so the input takes its name
 * from the title alone (`aria-labelledby`) and the description as its description.
 */
export function Switch({
  checked = false,
  onChange,
  label,
  description,
  toggleAt = 'start',
  ariaLabel,
  error,
  disabled = false,
  id,
  className,
  style,
}: WebSwitchProps) {
  const autoId = useId();
  const sid = id ?? autoId;
  const errId = `${sid}-err`;
  const titleId = `${sid}-title`;
  const descId = `${sid}-desc`;
  const hasError = error !== undefined && error !== null && error !== false;
  const described = description !== undefined;
  const namedByTitle = described && label !== undefined && ariaLabel === undefined;
  const describedBy = [described ? descId : null, hasError ? errId : null]
    .filter((part) => part !== null)
    .join(' ');
  /* The track is 52x32 and the target is 44 tall — the <label> is the hit box, because the real
     control is the visually hidden input. */
  const control = (
    <label
      className={classNames('hg-switch', hasError ? undefined : className)}
      data-checked={checked}
      data-disabled={disabled}
      data-error={hasError}
      data-described={described}
      data-toggle-at={toggleAt}
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
        aria-label={ariaLabel}
        aria-labelledby={namedByTitle ? titleId : undefined}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={disabled}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
      />
      <SwitchWords label={label} description={description} titleId={titleId} descId={descId} />
    </label>
  );
  if (!hasError) {
    return control;
  }
  return (
    <div
      className={classNames('hg-switch-wrap', className)}
      data-toggle-at={toggleAt}
      style={style}
    >
      {control}
      <span className="hg-switch-error" id={errId}>
        {error}
      </span>
    </div>
  );
}

/** The words beside the track: the label alone, or the title over its description. */
function SwitchWords({
  label,
  description,
  titleId,
  descId,
}: Pick<SwitchProps, 'label' | 'description'> & { titleId: string; descId: string }) {
  if (description === undefined) {
    return label !== undefined ? <span className="hg-switch-label">{label}</span> : null;
  }
  return (
    <span className="hg-switch-words">
      {label !== undefined ? (
        <span className="hg-switch-label" id={titleId}>
          {label}
        </span>
      ) : null}
      <span className="hg-switch-description" id={descId}>
        {description}
      </span>
    </span>
  );
}
