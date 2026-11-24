'use client';
import { type StudioScreen, useAimHold } from '@heliogrid/data/react';
import type { GroundPoint } from '@heliogrid/domain';
import { type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react';
import type { StudioDrive } from '../components/StudioCameraRig';

/** A press that moves less than this, in CSS pixels, is a tap; more moves the map. */
const TAP_PX = 6;

/** The desktop's own Undo and Redo: ⌘Z or Ctrl+Z, ⇧⌘Z or Ctrl+Y; as the buttons, idle when they rest. */
function historyKey(
  event: KeyboardEvent,
  can: { readonly undo: boolean; readonly redo: boolean },
  moves: StudioScreen['moves'],
): void {
  const key = event.key.toLowerCase();
  if (!(event.metaKey || event.ctrlKey) || (key !== 'z' && key !== 'y')) return;
  event.preventDefault();
  const redo = key === 'y' || event.shiftKey;
  if (redo && can.redo) moves.redo();
  if (!redo && can.undo) moves.undo();
}

/** The parts that keep a letter or Delete typed in them: a menu, a list of options, a sheet. */
const OWN_KEYS = '[role="dialog"], [role="menu"], [role="listbox"], [contenteditable="true"]';

/**
 * The desktop's roof keys, with nothing in hand: R opens Roofs for anyone once a roof stands; for
 * an editor D draws another roof in one press, and Delete removes the roof picked in the top view,
 * with what stands on it.
 */
function roofKey(event: KeyboardEvent, studio: StudioScreen): void {
  if (studio.roofStep.kind !== 'idle' || event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === 'r' && studio.roofList.rows.length > 0) {
    event.preventDefault();
    studio.moves.openRoofs();
  }
  if (studio.editing.kind !== 'editor') return;
  if (key === 'd') {
    event.preventDefault();
    studio.moves.draw();
  }
  if (event.key === 'Delete' && studio.view === 'top') {
    event.preventDefault();
    studio.moves.deleteRoof();
  }
}

/** A key pressed over the studio: Backspace and Enter while drawing, Undo and Redo, and Esc. */
function drawKey(
  event: KeyboardEvent,
  studio: StudioScreen,
  can: { readonly close: boolean; readonly undo: boolean; readonly redo: boolean },
): void {
  const { roofStep, moves } = studio;
  // Backspace, Enter and Undo typed into a field are that field's own.
  const target = event.target;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  if (event.key === 'Backspace' && roofStep.kind === 'drawing' && !typing) {
    event.preventDefault();
    moves.undo();
  }
  // Enter is Close shape while drawing, as it is the main act; on a button it is the button's.
  if (event.key === 'Enter' && can.close && !typing && !(target instanceof HTMLButtonElement)) {
    event.preventDefault();
    moves.close();
  }
  if (!typing) historyKey(event, can, moves);
  // A key typed in a field, a menu or a sheet is that part's own.
  const held = target instanceof Element && target.closest(OWN_KEYS) !== null;
  if (!typing && !held) roofKey(event, studio);
  // Esc is the phone's system back: the top thing open closes.
  // A part that took the Esc itself (a card, a field, a dialog) has had it.
  if (event.key === 'Escape' && !event.defaultPrevented) moves.back();
}

/**
 * The web's press on the map (a platform adapter, `T-M05-002` part b): a tap places a corner while
 * drawing, or lets a picked corner go; a drag is the camera's. On a phone a finger held still
 * while drawing aims, with the loupe, and places on lift; a mouse shows the spot as it moves. Esc
 * puts back what is in hand; R opens Roofs, D draws another roof and Delete removes the picked one.
 */
export function useDrawPress(
  studio: StudioScreen,
  drive: RefObject<StudioDrive | null>,
  /** A tap on the map, at its point on the page, whatever else it does. */
  onTapAt: (x: number, y: number) => void,
) {
  const { moves, roofStep } = studio;
  const drawing = roofStep.kind === 'drawing';
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const hold = useAimHold();
  // biome-ignore lint/plugin: where the aiming finger is on the page, which the loupe follows
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  // While drawing, a spot near the plan lies on its corner or its line (`T-M05-002d`, board 4.6).
  const magnet = studio.bar?.kind === 'drawing' && studio.bar.magnet;
  const groundAt = (x: number, y: number): GroundPoint | null => {
    const at = drive.current?.groundAt(x, y, 0) ?? null;
    return drawing ? studio.ownMoves.snapSpot(at, magnet) : at;
  };
  const stopAiming = () => {
    hold.stop();
    drive.current?.hold(false);
    setAim(null);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    press.current = { x: event.clientX, y: event.clientY, moved: false };
    if (!drawing || event.pointerType === 'mouse') return;
    const { clientX: x, clientY: y } = event;
    hold.start(() => {
      if (press.current?.moved !== false) return;
      drive.current?.hold(true);
      setAim({ x, y });
      moves.hover(groundAt(x, y));
    });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const held = press.current;
    if (held !== null && Math.hypot(event.clientX - held.x, event.clientY - held.y) > TAP_PX) {
      held.moved = true;
      if (aim === null) hold.stop();
    }
    if (!drawing) return;
    if (aim !== null) setAim({ x: event.clientX, y: event.clientY });
    const hovering = aim !== null || (event.pointerType === 'mouse' && event.buttons === 0);
    if (hovering) moves.hover(groundAt(event.clientX, event.clientY));
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const held = press.current;
    press.current = null;
    const aimed = aim !== null;
    stopAiming();
    if (held === null || (held.moved && !aimed)) return;
    if (!drawing) onTapAt(event.clientX, event.clientY);
    // In 3D a tap is the roofs' own (their sheet): the ground under it is not what was tapped.
    if (studio.view !== 'top') return;
    const at = groundAt(event.clientX, event.clientY);
    if (at !== null) moves.tap(at);
  };
  // Esc puts back what is in hand: the draft (one Undo takes it up again), the length in the box, a
  // drag, a picked corner. Backspace takes the
  // last corner off while drawing. Alt held draws free for a moment: the magnet rests until it is
  // let go, or the window loses it.
  const canClose = studio.bar?.kind === 'drawing' && studio.bar.canClose;
  const { canUndo, canRedo } = studio;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Alt') moves.drawFree(event.type === 'keydown');
      if (event.type === 'keydown')
        drawKey(event, studio, { close: canClose, undo: canUndo, redo: canRedo });
    };
    const onBlur = () => moves.drawFree(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
    };
  }, [studio, canClose, canUndo, canRedo, moves]);
  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (drawing && event.pointerType === 'mouse') moves.hover(null);
  };
  return {
    aim,
    /** A drag on a roof mark aims too: its finger shows the loupe. */
    aimAt: setAim,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: stopAiming,
      onPointerLeave,
    },
  };
}
