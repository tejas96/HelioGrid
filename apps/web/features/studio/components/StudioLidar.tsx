'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import {
  Button,
  IconButton,
  LoadingBars,
  SegmentedControl,
  ShellGlyph,
  useFormat,
} from '@heliogrid/ui';
import { type Ref, type RefObject, useRef } from 'react';
import type { footHolderOf, footRefsOf } from './canvas-foot';
import { LidarFootMessage } from './StudioLidarFootMessage';
import { StudioLidarKey } from './StudioLidarKey';
import { StudioLidarMove } from './StudioLidarMove';
import { StudioLidarPins } from './StudioLidarPins';

/**
 * LiDAR's own parts in the studio's 3D view (`T-M05-002g`, board v17): its round button in the right
 * column, the head's × · Heights | Photo · Move, the one instruction under the head, and the foot —
 * one message with one action, the key on a phone, and the scan's waiting, unreached and absent
 * states. Every part is the studio's own: its round tools, its hint, its bar, its glass.
 */

interface LidarFacts {
  readonly studio: StudioScreen;
  readonly words: StudioCanvasWords;
}

/** LiDAR is on in the 3D view: its head and foot take the studio's place. */
export const lidarShown = (studio: StudioScreen) => studio.lidar.view.on && studio.view !== 'top';

/**
 * The right column's LiDAR button (glyph `building`): pressed while on. Where the place has no
 * height data it stays, dimmed, and a tap says why.
 */
export function LidarButton({ studio, words }: LidarFacts) {
  const { lidar } = studio;
  const none = lidar.scan === 'none';
  return (
    <IconButton
      label={none ? words.lidarNoData : words.lidar}
      pressed={lidar.view.on}
      aria-disabled={none ? true : undefined}
      onClick={none ? () => lidar.moves.why(!lidar.view.why) : lidar.moves.toggle}
    >
      <ShellGlyph name="building" size="md" />
    </IconButton>
  );
}

/** The head's start: × turns LiDAR off. */
export function LidarHeadStart({ studio, words }: LidarFacts) {
  return (
    <span className="hg-lidar-round">
      <IconButton label={words.lidarOff} onClick={studio.lidar.moves.off}>
        <ShellGlyph name="close" size="md" />
      </IconButton>
    </span>
  );
}

/** The head's middle: Heights | Photo, once the scan is in; glyphs alone on a phone. */
export function LidarLooks({ studio, words, phone }: LidarFacts & { readonly phone: boolean }) {
  const { lidar } = studio;
  if (lidar.scan !== 'in') return null;
  return (
    <div className="hg-lidar-looks">
      <SegmentedControl
        ariaLabel={words.lidarLook}
        iconOnly={phone}
        value={lidar.view.look}
        options={[
          { value: 'heights', label: words.lidarHeights, glyph: 'storeys' },
          { value: 'photo', label: words.lidarPhoto, glyph: 'image' },
        ]}
        onChange={(look) => lidar.moves.look(look === 'photo' ? 'photo' : 'heights')}
      />
    </div>
  );
}

/** The head's end: Move, once the scan is in, for a person who may edit. */
export function LidarMoveButton({ studio, words }: LidarFacts) {
  const { lidar } = studio;
  if (lidar.scan !== 'in' || !lidar.canEdit) return null;
  return (
    <span className="hg-lidar-round">
      <IconButton
        label={words.lidarMove}
        pressed={lidar.view.move !== null}
        onClick={lidar.moves.move}
      >
        <ShellGlyph name="move" size="md" />
      </IconButton>
    </span>
  );
}

/** The instruction under the head: one line, no button, short words. */
export function LidarHint({ studio, words, phone }: LidarFacts & { readonly phone: boolean }) {
  const format = useFormat();
  const { lidar } = studio;
  if (!lidarShown(studio) || lidar.hint === null) return null;
  const distance =
    lidar.hint.kind === 'moving' ? format.roofHeight(lidar.hint.metres, studio.units) : '';
  return (
    <p className="hg-studio-glass hg-studio-hint" role="status">
      {words.lidarHint(lidar.hint, phone, distance)}
    </p>
  );
}

/** The key on the 3D: under the head at the end on a wide screen. */
export function LidarKeyCard({ studio, words, phone }: LidarFacts & { readonly phone: boolean }) {
  const { lidar } = studio;
  if (phone || !lidarShown(studio) || lidar.scan !== 'in' || lidar.view.move !== null) return null;
  return (
    <div className="hg-lidar-key-card">
      <StudioLidarKey studio={studio} words={words} inPanel={false} />
    </div>
  );
}

/** The scan on its way: the frame is there at once, and a card says what waits, its bars loading. */
function Waiting({
  words,
  holder,
}: Pick<LidarFacts, 'words'> & { readonly holder: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={holder}
      tabIndex={-1}
      className="hg-studio-glass hg-studio-view-panel hg-lidar-wait"
      role="status"
      aria-busy="true"
    >
      <strong>{words.lidarLoading}</strong>
      <LoadingBars bars={['text', 'text']} inBusyRegion />
    </div>
  );
}

/**
 * LiDAR's foot (board frames 3–5, 10–17): the scan's waiting or unreached card, the one message
 * with its action, and on a phone the key, each between the tool columns. The sun bar, a roof's
 * sheet and Move hold the foot themselves.
 */
export function StudioLidarFoot({
  studio,
  words,
  phone,
  footRef,
}: LidarFacts & { readonly phone: boolean; readonly footRef: Ref<HTMLDivElement> | null }) {
  const { lidar } = studio;
  const waiting = useRef<HTMLDivElement>(null);
  if (!lidarShown(studio)) return null;
  if (lidar.scan === 'coming') {
    return (
      <div ref={footRef} className="hg-lidar-foot">
        <Waiting words={words} holder={waiting} />
      </div>
    );
  }
  if (lidar.scan === 'failed') {
    return (
      <div ref={footRef} className="hg-lidar-foot">
        <div className="hg-studio-glass hg-studio-view-panel hg-lidar-wait" role="alert">
          <strong>{words.lidarFailed}</strong>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              lidar.moves.retryScan();
              // Try again leaves with its card: the focus goes to the waiting card in its place.
              requestAnimationFrame(() => waiting.current?.focus());
            }}
          >
            {words.tryAgain}
          </Button>
        </div>
      </div>
    );
  }
  if (lidar.scan === 'unreached') {
    return (
      <div ref={footRef} className="hg-lidar-foot">
        <div className="hg-studio-glass hg-studio-view-panel hg-lidar-wait" role="alert">
          <strong>{words.lidarOfflineTitle}</strong>
          <p>{words.lidarOfflineLine}</p>
          <Button variant="secondary" size="sm" onClick={studio.site.retry}>
            {words.tryAgain}
          </Button>
        </div>
      </div>
    );
  }
  const { foot, view } = lidar;
  const keyShown = phone && view.move === null && (view.sunlight || view.look === 'heights');
  if (foot === null && !keyShown) return null;
  return (
    <div ref={footRef} className="hg-lidar-foot">
      {keyShown ? <StudioLidarKey studio={studio} words={words} inPanel={false} /> : null}
      <LidarFootMessage studio={studio} words={words} phone={phone} />
    </div>
  );
}

/**
 * Where the place has no height data (board frame 2): a tap on the dimmed button says why, between
 * the tool columns, until its × or the next tap on the map.
 */
export function LidarWhy({ studio, words }: LidarFacts) {
  const { lidar } = studio;
  if (!lidar.view.why || lidar.scan !== 'none') return null;
  return (
    <div className="hg-lidar-foot">
      <div className="hg-studio-glass hg-studio-bar hg-lidar-bar" data-kind="card" data-tone="info">
        <span className="hg-studio-bar-sign" aria-hidden="true">
          <ShellGlyph name="info" size="md" tone="current" />
        </span>
        <span className="hg-studio-bar-words">
          <span className="hg-studio-bar-name">{words.lidarNoData}</span>
          <span className="hg-studio-bar-line" role="status">
            {words.lidarNoDataLine}
          </span>
        </span>
        <span className="hg-studio-bar-acts">
          <IconButton
            label={words.lidarHide}
            variant="ghost"
            onClick={() => lidar.moves.why(false)}
          >
            <ShellGlyph name="close" size="sm" />
          </IconButton>
        </span>
      </div>
    </div>
  );
}

/** LiDAR's parts over the canvas: the pins, and Move or the foot where LiDAR holds the foot. */
export function StudioLidarParts({
  studio,
  words,
  phone,
  holder,
  foot,
  pins,
  turnOf,
}: LidarFacts & {
  readonly phone: boolean;
  readonly holder: ReturnType<typeof footHolderOf>;
  readonly foot: ReturnType<typeof footRefsOf>;
  readonly pins: RefObject<HTMLDivElement | null>;
  readonly turnOf: () => number;
}) {
  return (
    <>
      <StudioLidarPins studio={studio} words={words} holder={pins} />
      {holder === 'move' ? (
        <StudioLidarMove
          studio={studio}
          words={words}
          units={studio.units}
          turnOf={turnOf}
          phone={phone}
          footRef={foot.move}
        />
      ) : null}
      {holder === 'lidar' ? (
        <StudioLidarFoot studio={studio} words={words} phone={phone} footRef={foot.lidar} />
      ) : null}
      {lidarShown(studio) ? null : <LidarWhy studio={studio} words={words} />}
    </>
  );
}
