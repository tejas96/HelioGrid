import { classNames } from '../class-names';
import type { FieldProps } from './Field.types';

interface WebFieldProps extends FieldProps {
  /**
   * id of the wrapped control, for the label's `for`. When set, the hint renders with id
   * `<htmlFor>-hint` and the error with id `<htmlFor>-error` — the control should name
   * whichever is showing in its aria-describedby.
   */
  htmlFor?: string;
  className?: string;
}

/** Label + hint + error + required marker. The error is WORDS, never a tint alone. */
export function Field({
  children,
  label,
  hint,
  error,
  required = false,
  htmlFor,
  className,
}: WebFieldProps) {
  return (
    <div className={classNames('hg-field', className)}>
      <label className="hg-field-label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="hg-field-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint !== undefined && error === undefined ? (
        <p className="hg-field-hint" id={htmlFor !== undefined ? `${htmlFor}-hint` : undefined}>
          {hint}
        </p>
      ) : null}
      {error !== undefined ? (
        <p
          className="hg-field-error"
          id={htmlFor !== undefined ? `${htmlFor}-error` : undefined}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
