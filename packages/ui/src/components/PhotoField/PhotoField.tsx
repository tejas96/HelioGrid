import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { Avatar } from '../Avatar';
import { initialsOf } from '../Avatar/Avatar.types';
import { Button } from '../Button';
import type { PhotoFieldProps } from './PhotoField.types';

interface WebPhotoFieldProps extends PhotoFieldProps {
  className?: string;
  style?: CSSProperties;
}

/** The act's words: replacing a photo is a different act from choosing a first one. */
function actLabel(hasPhoto: boolean, chooseLabel: string, replaceLabel?: string): string {
  return hasPhoto && replaceLabel !== undefined ? replaceLabel : chooseLabel;
}

/**
 * `Avatar` derives its fallback from `name`, so an EMPTY name renders an empty tinted circle. That
 * is a rendering fault rather than "no name yet", so a nameless field draws a neutral mark — the
 * fill follows whatever is behind it, and `F7-19` forbids inventing an image to fill it.
 */
function Mark({ src, name, size }: { src?: string; name: string; size: number }) {
  if (src === undefined && initialsOf(name).length === 0) {
    return <span className="hg-photo-field-nameless" aria-hidden="true" />;
  }
  return <Avatar src={src} name={name} size={size} />;
}

/**
 * ONE image, captured into the circle it will live in.
 *
 * The fallback is on screen, which is what makes "optional" honest: with no photo the circle shows
 * the caller's initials, so the frame shows the exact result of not choosing one. There is no
 * `Skip` act — a photo has no gate to skip past, and a second control would invent a decision
 * nobody has to make.
 */
export function PhotoField({
  label,
  src,
  name = '',
  size = 72,
  onChoose,
  onRemove,
  chooseLabel,
  replaceLabel,
  removeLabel,
  error,
  helper,
  loading = false,
  disabled = false,
  className,
  style,
}: WebPhotoFieldProps) {
  const messageId = useId();
  const message = error ?? helper;
  const hasPhoto = src !== undefined;
  const inert = disabled || loading;
  const removable = hasPhoto && onRemove !== undefined && removeLabel !== undefined;

  return (
    <fieldset
      className={classNames('hg-photo-field', className)}
      style={style}
      aria-describedby={message === undefined ? undefined : messageId}
    >
      {/* The name is spoken, not shown: the circle and its act already say what this is on screen. */}
      <legend className="hg-photo-field-legend">{label}</legend>
      <div
        className="hg-photo-field-mark"
        data-size={size}
        data-error={error === undefined ? undefined : 'true'}
        data-loading={loading ? 'true' : undefined}
      >
        <Mark src={src} name={name} size={size} />
      </div>
      <div className="hg-photo-field-acts">
        <Button
          variant="secondary"
          size="sm"
          onClick={onChoose}
          disabled={inert || onChoose === undefined}
        >
          {actLabel(hasPhoto, chooseLabel, replaceLabel)}
        </Button>
        {/* Removing destroys nothing — the file is still the person's and the initials come back —
            so it needs no confirmation (`N8`). It appears only when there is something to remove. */}
        {removable ? (
          <Button variant="ghost" size="sm" onClick={onRemove} disabled={inert}>
            {removeLabel}
          </Button>
        ) : null}
      </div>
      {message === undefined ? null : (
        <p
          id={messageId}
          className="hg-photo-field-message"
          data-error={error === undefined ? undefined : 'true'}
          role={error === undefined ? undefined : 'alert'}
        >
          {message}
        </p>
      )}
    </fieldset>
  );
}
