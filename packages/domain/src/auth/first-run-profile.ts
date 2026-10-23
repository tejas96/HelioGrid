/**
 * First-Run Profile's flow (`SCR-M01-09`, `M01-14`), decided once for both platforms (Law 11): the
 * name the inviter typed, an optional photo, and one act that saves the name, then the photo. The
 * photo is judged by the file rule the api stores it under, so the screen refuses only what the
 * api would. Profile & preferences' *Edit name* editor (`SCR-M01-11`) runs the same flow from the
 * person's saved name and photo (`profileEditorStart`).
 */
import { FILE_SUBJECT_RULES, judgeFileDeclaration } from '../files/rules';
import { FILE_CONTENT_TYPES } from '../files/vocabulary';
import { megabytesShown } from '../tenancy/company-logo';

/**
 * A profile photo's longest side once a phone shrinks it: twice the 120 px circle at 2× density —
 * plenty for an avatar, and well under the 2 MB a file may be (`FILE_MAX_BYTES`), which a phone
 * photograph is not.
 */
export const PROFILE_PHOTO_MAX_SIDE_PX = 512;

/** The contract's `PATCH /users/me` bound on a name (`user.ts`): typing past it keeps the start. */
export const PROFILE_NAME_MAX_LENGTH = 120;

/**
 * What the join hands this step, for this one visit (brief ruling 17): who invited the person, to
 * which company, and the name they typed. Only an account the join named from the invite carries
 * one (ruling 18).
 */
export interface FirstRunCarry {
  readonly inviterName: string;
  readonly companyName: string;
  readonly name: string;
}

/** An image as the device reads it before any upload, and the picture it is drawn from. */
export interface FirstRunPhotoChoice {
  readonly contentType: string;
  readonly byteSize: number;
  readonly picture: string | null;
}

export type FirstRunPhoto =
  | { readonly kind: 'none' }
  /** The photo the server holds, as the editor opens over it; its picture `null` until its link arrives. */
  | { readonly kind: 'saved'; readonly picture: string | null }
  | { readonly kind: 'chosen'; readonly picture: string | null }
  | { readonly kind: 'refused'; readonly missed: 'type' | 'size'; readonly megabytes: number };

export interface FirstRunProfileState {
  readonly phase: 'loading' | 'editing' | 'saving-name' | 'saving-photo' | 'done';
  readonly name: string;
  /** The name on the server is the one in the field: the photo alone is left to send. */
  readonly nameSaved: boolean;
  readonly photo: FirstRunPhoto;
  /** The server holds a photo: taking it away is a write, as choosing one is. */
  readonly photoOnServer: boolean;
  readonly refusal: null | 'save' | 'photo';
  readonly emptyPressed: boolean;
}

export type FirstRunProfileEvent =
  | { readonly type: 'arrived'; readonly name: string }
  | { readonly type: 'name-typed'; readonly name: string }
  | { readonly type: 'photo-chosen'; readonly image: FirstRunPhotoChoice }
  | { readonly type: 'photo-removed' }
  | { readonly type: 'save' }
  | { readonly type: 'retry-photo' }
  | { readonly type: 'name-ended'; readonly saved: boolean }
  | { readonly type: 'photo-ended'; readonly saved: boolean };

/** The screen before any name: `null` waits for one (`loading`). */
export function firstRunProfileStart(name: string | null): FirstRunProfileState {
  return {
    phase: name === null ? 'loading' : 'editing',
    name: name ?? '',
    nameSaved: false,
    photo: { kind: 'none' },
    photoOnServer: false,
    refusal: null,
    emptyPressed: false,
  };
}

/** The person's photo as the server holds it: held or not, and its picture once its link arrives. */
export interface SavedPhoto {
  readonly held: boolean;
  readonly picture: string | null;
}

/**
 * The editor over the person's saved name and photo: nothing is owed until one of them changes.
 * Whether a photo is held is the server's answer, apart from its picture, whose link may not have
 * arrived — a held photo is never taken for none.
 */
export function profileEditorStart(name: string, saved: SavedPhoto): FirstRunProfileState {
  return {
    ...firstRunProfileStart(name),
    nameSaved: true,
    photo: saved.held ? { kind: 'saved', picture: saved.picture } : { kind: 'none' },
    photoOnServer: saved.held,
  };
}

/** A chosen photo is sent; no photo is sent too when the server still holds one. */
function photoOwed(state: FirstRunProfileState): boolean {
  return state.photo.kind === 'chosen' || (state.photo.kind === 'none' && state.photoOnServer);
}

/** A photo the `user_account` rule takes is `chosen`; any other is refused on the device, never stored. */
function photoOf(image: FirstRunPhotoChoice): FirstRunPhoto {
  const rule = FILE_SUBJECT_RULES.user_account;
  const declared = FILE_CONTENT_TYPES.find((known) => known === image.contentType);
  const verdict =
    declared === undefined
      ? 'type-not-taken'
      : judgeFileDeclaration(rule, declared, image.byteSize);
  if (verdict === 'accepted') return { kind: 'chosen', picture: image.picture };
  const missed = verdict === 'too-large' ? 'size' : 'type';
  return { kind: 'refused', missed, megabytes: megabytesShown(image.byteSize) };
}

/** After the name is on the server: the chosen photo, else the step is done. */
function afterName(state: FirstRunProfileState): FirstRunProfileState {
  const next = { ...state, nameSaved: true, refusal: null };
  return photoOwed(state) ? { ...next, phase: 'saving-photo' } : { ...next, phase: 'done' };
}

function photoRefusalCleared(state: FirstRunProfileState): FirstRunProfileState['refusal'] {
  return state.refusal === 'photo' ? null : state.refusal;
}

function pressed(state: FirstRunProfileState): FirstRunProfileState {
  if (state.refusal === 'photo') return { ...state, phase: 'done' };
  if (state.name.trim() === '') return { ...state, emptyPressed: true };
  if (state.nameSaved) return afterName(state);
  return { ...state, phase: 'saving-name', refusal: null, emptyPressed: false };
}

function editing(state: FirstRunProfileState, event: FirstRunProfileEvent): FirstRunProfileState {
  switch (event.type) {
    case 'name-typed': {
      const name = event.name.slice(0, PROFILE_NAME_MAX_LENGTH);
      const changed = name !== state.name;
      return {
        ...state,
        name,
        nameSaved: state.nameSaved && !changed,
        refusal: changed && state.refusal === 'photo' ? null : state.refusal,
        emptyPressed: state.emptyPressed && name.trim() === '',
      };
    }
    // A new photo or none answers only the photo's refusal: the name's stands until it saves.
    case 'photo-chosen':
      return { ...state, photo: photoOf(event.image), refusal: photoRefusalCleared(state) };
    case 'photo-removed':
      return { ...state, photo: { kind: 'none' }, refusal: photoRefusalCleared(state) };
    case 'save':
      return pressed(state);
    case 'retry-photo':
      return state.refusal === 'photo' ? { ...state, phase: 'saving-photo', refusal: null } : state;
    default:
      return state;
  }
}

export function firstRunProfileReducer(
  state: FirstRunProfileState,
  event: FirstRunProfileEvent,
): FirstRunProfileState {
  switch (state.phase) {
    case 'loading':
      return event.type === 'arrived' ? firstRunProfileStart(event.name) : state;
    case 'editing':
      return editing(state, event);
    case 'saving-name':
      if (event.type !== 'name-ended') return state;
      return event.saved ? afterName(state) : { ...state, phase: 'editing', refusal: 'save' };
    case 'saving-photo':
      if (event.type !== 'photo-ended') return state;
      return event.saved
        ? { ...state, phase: 'done', photoOnServer: state.photo.kind === 'chosen' }
        : { ...state, phase: 'editing', refusal: 'photo' };
    case 'done':
      return state;
  }
}

export type FirstRunProfileFrameKind =
  | 'loading'
  | 'normal'
  | 'empty'
  | 'empty-pressed'
  | 'error-save'
  | 'error-photo'
  | 'photo-added'
  | 'photo-refused';

/** What the screen draws: the frame, the act's label, and what the field and the photo say. */
export interface FirstRunProfileFrame {
  readonly kind: FirstRunProfileFrameKind;
  /** `continue` once the photo alone failed: *Continue without a photo*. */
  readonly act: 'save' | 'continue';
  /** A save is out: the act waits and a press sends nothing. */
  readonly busy: boolean;
  readonly nameSaved: boolean;
  /** `retry` re-sends the photo alone; `add` opens the picker. */
  readonly photoAct: 'add' | 'retry';
  readonly photo: FirstRunPhoto;
}

function kindOf(state: FirstRunProfileState): FirstRunProfileFrameKind {
  if (state.phase === 'loading') return 'loading';
  // An emptied name answers on its field before an earlier refusal (brief decision 4).
  if (state.name.trim() === '') return state.emptyPressed ? 'empty-pressed' : 'empty';
  if (state.refusal === 'save') return 'error-save';
  if (state.refusal === 'photo') return 'error-photo';
  if (state.photo.kind === 'refused') return 'photo-refused';
  return state.photo.kind === 'none' ? 'normal' : 'photo-added';
}

export function firstRunProfileFrame(state: FirstRunProfileState): FirstRunProfileFrame {
  const failedPhoto = state.refusal === 'photo';
  return {
    kind: kindOf(state),
    act: failedPhoto ? 'continue' : 'save',
    busy: state.phase === 'saving-name' || state.phase === 'saving-photo',
    nameSaved: state.nameSaved,
    photoAct: failedPhoto ? 'retry' : 'add',
    photo: state.photo,
  };
}
