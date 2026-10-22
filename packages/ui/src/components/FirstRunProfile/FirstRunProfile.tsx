import { type KeyboardEvent, useEffect, useId } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useDesktopShell } from '../AppShell/use-desktop-shell';
import { Banner } from '../Banner/Banner';
import { Button } from '../Button/Button';
import { IconCircle } from '../Card/Card';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { Explainer } from '../Explainer/Explainer';
import { Input } from '../Input/Input';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { PhotoField } from '../PhotoField/PhotoField';
import type { FirstRunProfileProps, FirstRunProfileWords } from './FirstRunProfile.types';

/* The board's `iconCircle`: each reason's mark in a 40 circle (`SCR-M01-09` d-normal). */
const REASON_CIRCLE = 40;
const REASON_GLYPHS = ['user', 'camera', 'pencil'] as const;

/**
 * First-Run Profile in the onboarding frame. At 375: the heading with its ask, the name, the photo,
 * then the act right under the photo group (ruling 13). From the breakpoint: the heading and the
 * three reasons in the brand pane, and one centred column — the photo, the name, the act — whose
 * name field takes the focus and whose Enter commits (decision 7). The order is the stylesheet's.
 */
export function FirstRunProfile(props: FirstRunProfileProps) {
  const { language, words, frame, onSave } = props;
  const wide = useDesktopShell() === true;
  const nameId = useId();
  const loading = frame.kind === 'loading';

  useEffect(() => {
    if (wide && !loading) document.getElementById(nameId)?.focus();
  }, [wide, loading, nameId]);

  const commitOnEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) onSave();
  };

  return (
    <DoorFrame
      panes="onboarding"
      taskMeasure="field"
      trailing={language}
      identity={<Identity words={words} wide={wide} />}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Enter in the name field commits the step; the field itself is the control */}
      <div className="hg-first-run" data-frame={frame.kind} onKeyDown={commitOnEnter}>
        {words.saveFailed === null ? null : (
          <Banner kind="validation" title={words.saveFailed.title} className="hg-first-run-refusal">
            {words.saveFailed.line}
          </Banner>
        )}
        <div className="hg-first-run-name">
          {loading ? (
            <LoadingBars label={words.name.loading} bars={['row']} />
          ) : (
            <Input
              id={nameId}
              label={words.name.label}
              value={props.name}
              onChange={props.onName}
              helper={words.name.helper}
              error={words.name.error ?? undefined}
              success={words.name.success ?? undefined}
            />
          )}
        </div>
        <Photo {...props} wide={wide} />
        <Button
          variant="primary"
          size="lg"
          fullWidth
          className="hg-first-run-act"
          loading={frame.busy}
          disabled={loading}
          disabledReason={words.actReason ?? undefined}
          onClick={onSave}
        >
          {words.act}
        </Button>
      </div>
    </DoorFrame>
  );
}

/** The heading — with its ask under the breakpoint, and over the three reasons from it. */
function Identity({ words, wide }: { words: FirstRunProfileWords; wide: boolean }) {
  const { label, title, pages, nextLabel, backLabel, positionLabel } = words.about;
  return (
    <div className="hg-first-run-identity">
      <div className="hg-first-run-heading">
        <Text variant={wide ? 'h1' : 'h2'} as="h1">
          {words.heading}
        </Text>
        <span className="hg-first-run-narrow-only">
          <Explainer
            label={label}
            title={title}
            pages={pages}
            nextLabel={nextLabel}
            backLabel={backLabel}
            positionLabel={positionLabel}
          />
        </span>
      </div>
      <ul className="hg-first-run-reasons hg-door-wide-only">
        {words.reasons.map((reason, index) => (
          <li key={REASON_GLYPHS[index]} className="hg-first-run-reason">
            <IconCircle color="var(--accent)" size={REASON_CIRCLE}>
              <ShellGlyph name={REASON_GLYPHS[index] ?? 'user'} size="md" tone="accent" />
            </IconCircle>
            <Text variant="body" color="secondary">
              {reason}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The photo group: 72 on the phone's row, 120 with a drop from the breakpoint (ruling 11). */
function Photo({
  words,
  frame,
  name,
  picture,
  wide,
  ...acts
}: FirstRunProfileProps & { wide: boolean }) {
  const { photo } = words;
  const retry = frame.photoAct === 'retry';
  return (
    <PhotoField
      className="hg-first-run-photo"
      label={photo.label}
      src={frame.photo.kind === 'chosen' ? picture : undefined}
      name={frame.kind === 'loading' ? '' : name}
      size={wide ? 120 : 72}
      actIcon={retry ? 'retry' : wide ? 'upload' : 'camera'}
      chooseLabel={wide ? photo.chooseWide : photo.choosePhone}
      replaceLabel={photo.replace}
      removeLabel={photo.remove}
      onChoose={retry ? acts.onRetryPhoto : acts.onChoosePhoto}
      onRemove={acts.onRemovePhoto}
      onDrop={wide ? acts.onDropPhoto : undefined}
      error={photo.error === null ? undefined : wide ? photo.error.wide : photo.error.phone}
      errorTitle={photo.error?.title}
      helper={photo.helper}
      loading={frame.kind === 'loading' || (frame.busy && frame.nameSaved)}
      disabled={frame.busy}
    />
  );
}
