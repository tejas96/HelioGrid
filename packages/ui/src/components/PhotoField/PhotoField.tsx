import type { CSSProperties, DragEvent } from 'react';
import { useId, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { closingPress, type FocusHandle } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Banner } from '../Banner';
import { Button } from '../Button';
import type { PickedFile } from '../Dropzone/Dropzone.types';
import { pickedFileOf } from '../Dropzone/picked-file';
import { actLabel, drawsNamelessMark, isDesktopComposition, removalOf } from './PhotoField.logic';
import type { PhotoFieldProps } from './PhotoField.types';

interface WebPhotoFieldProps extends PhotoFieldProps {
  className?: string;
  style?: CSSProperties;
}

/** A nameless field's neutral mark takes its fill from whatever is behind it. */
function Mark({ src, name, size }: { src?: string; name: string; size: number }) {
  if (drawsNamelessMark(src, name)) {
    return <span className="hg-photo-field-nameless" aria-hidden="true" />;
  }
  return <Avatar src={src} name={name} size={size} />;
}

/** The circle takes a dropped image only where `onDrop` is given, and rings while one is over it. */
function useDrop(onDrop: ((file: PickedFile) => void) | undefined, inert: boolean) {
  const [over, setOver] = useState(false);
  if (onDrop === undefined || inert) return { over: false, handlers: {} };
  return {
    over,
    handlers: {
      onDragOver: (event: DragEvent) => {
        event.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file !== undefined) onDrop(pickedFileOf(file));
      },
    },
  };
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
  onDrop,
  chooseLabel,
  replaceLabel,
  removeLabel,
  actIcon = 'camera',
  error,
  errorTitle,
  helper,
  loading = false,
  disabled = false,
  className,
  style,
}: WebPhotoFieldProps) {
  const messageId = useId();
  const hasPhoto = src !== undefined;
  const inert = disabled || loading;
  const removal = removalOf(hasPhoto, onRemove, removeLabel);
  const drop = useDrop(onDrop, inert);
  // *Remove* goes away once pressed: the focus stays in the group, on the act that takes its place.
  const chooseRef = useRef<FocusHandle>(null);

  const banner =
    error === undefined ? null : (
      <Banner kind="validation" title={errorTitle} className="hg-photo-field-banner">
        {error}
      </Banner>
    );
  const acts = (
    <div className="hg-photo-field-acts">
      <Button
        ref={chooseRef}
        variant="secondary"
        size="md"
        icon={<ShellGlyph name={actIcon} size="md" tone="primary" />}
        onClick={onChoose}
        disabled={inert || onChoose === undefined}
      >
        {actLabel(hasPhoto, chooseLabel, replaceLabel)}
      </Button>
      {/* Removing destroys nothing — the file is still the person's and the initials come back —
          so it needs no confirmation (`N8`). It appears only when there is something to remove. */}
      {removal !== null ? (
        <Button
          variant="ghost"
          size="md"
          onClick={closingPress(chooseRef)(removal.remove)}
          disabled={inert}
        >
          {removal.label}
        </Button>
      ) : null}
    </div>
  );
  const message =
    helper === undefined ? null : (
      <p id={messageId} className="hg-photo-field-message">
        {helper}
      </p>
    );

  return (
    <fieldset
      className={classNames('hg-photo-field', className)}
      data-size={size}
      style={style}
      aria-describedby={helper === undefined ? undefined : messageId}
    >
      {/* The name is spoken, not shown: the circle and its act already say what this is on screen. */}
      <legend className="hg-spoken-only">{label}</legend>
      <div
        className="hg-photo-field-mark"
        data-size={size}
        data-over={drop.over ? 'true' : undefined}
        data-loading={loading ? 'true' : undefined}
        {...drop.handlers}
      >
        <Mark src={src} name={name} size={size} />
      </div>
      {isDesktopComposition(size) ? (
        <div className="hg-photo-field-column">
          {banner}
          {acts}
          {message}
        </div>
      ) : (
        <>
          {acts}
          {banner}
          {message}
        </>
      )}
    </fieldset>
  );
}
