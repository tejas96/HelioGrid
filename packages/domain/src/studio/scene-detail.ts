/**
 * How much detail the 3D view draws (`T-M05-002`, *Look and motion*, G034): a weak phone shows less
 * detail and the same numbers. The view starts at full detail, a step lower on a small device, and
 * steps down once more each time it draws slowly while it moves; it never steps back up while it
 * is open, so it never flickers between two looks. Only the drawing changes: every value, mark and
 * tag the view shows stays as it is.
 */

export const SCENE_DETAILS = ['full', 'lighter', 'light'] as const;
export type SceneDetail = (typeof SCENE_DETAILS)[number];

/** What each detail draws: the most pixels per CSS pixel, the sun's shadow map, soft shadow edges. */
export interface SceneDetailLook {
  readonly maxPixelRatio: number;
  readonly shadowMapPx: number;
  readonly softShadows: boolean;
}

export const SCENE_DETAIL_LOOK: Record<SceneDetail, SceneDetailLook> = {
  full: { maxPixelRatio: 2, shadowMapPx: 2048, softShadows: true },
  lighter: { maxPixelRatio: 1.5, shadowMapPx: 1024, softShadows: true },
  light: { maxPixelRatio: 1, shadowMapPx: 512, softShadows: false },
};

/** What the device says of itself, where it says it: its processor cores and its memory. */
export interface DeviceHints {
  readonly cores: number | null;
  readonly memoryGb: number | null;
}

/** A device with this few cores, or this little memory in gigabytes, starts a step lower. */
export const SMALL_DEVICE_CORES = 4;
export const SMALL_DEVICE_MEMORY_GB = 4;

/** The detail the view opens at: full, or a step lower on a device that says it is small. */
export function sceneDetailAtStart({ cores, memoryGb }: DeviceHints): SceneDetail {
  const fewCores = cores !== null && cores <= SMALL_DEVICE_CORES;
  const littleMemory = memoryGb !== null && memoryGb <= SMALL_DEVICE_MEMORY_GB;
  return fewCores || littleMemory ? 'lighter' : 'full';
}

/** A frame drawn longer than this after the one before is the view coming back from rest. */
export const MOVING_FRAME_MAX_MS = 250;
/** Frames slower than this, in the middle, are a view that cannot keep up: under 25 a second. */
export const SLOW_FRAME_MS = 40;
/** How many frames of movement are judged at a time. */
export const FRAMES_JUDGED = 30;

/** The time between frames drawn while the view moves: a gap longer than a moving frame is rest. */
export function movingFrames(gapsMs: readonly number[]): number[] {
  return gapsMs.filter((gap) => gap > 0 && gap <= MOVING_FRAME_MAX_MS);
}

/**
 * The detail after a run of moving frames: a step lower where the middle frame of the last
 * `FRAMES_JUDGED` is slow, else as it was. Fewer frames than that say nothing yet.
 */
export function sceneDetailAfter(now: SceneDetail, movingMs: readonly number[]): SceneDetail {
  if (movingMs.length < FRAMES_JUDGED) return now;
  const judged = [...movingMs.slice(-FRAMES_JUDGED)].sort((a, b) => a - b);
  const middle = judged[Math.floor(judged.length / 2)] ?? 0;
  if (middle <= SLOW_FRAME_MS) return now;
  return SCENE_DETAILS[Math.min(SCENE_DETAILS.indexOf(now) + 1, SCENE_DETAILS.length - 1)] ?? now;
}

/**
 * The view's detail as it stands, and the frames drawn since it was last judged. `rested`: the
 * view has come to rest once since it opened.
 */
export interface SceneDetailState {
  readonly detail: SceneDetail;
  readonly moving: readonly number[];
  readonly rested: boolean;
}

/** The view as it opens: at the detail the device's hints give it, with no frame drawn yet. */
export const sceneDetailStart = (hints: DeviceHints): SceneDetailState => ({
  detail: sceneDetailAtStart(hints),
  moving: [],
  rested: false,
});

/**
 * A frame drawn, `gapMs` after the one before: a frame of movement is judged with the ones before
 * it; a step lower starts the judging again, as the frames before it were drawn at more detail. A
 * gap after rest is no frame of movement. Nothing is judged until the view has rested once: the
 * flight that opens it draws while its shaders compile and its picture arrives.
 */
export function sceneDetailHeard(state: SceneDetailState, gapMs: number): SceneDetailState {
  const frames = movingFrames([gapMs]);
  if (frames.length === 0) return state.rested ? state : { ...state, rested: true };
  if (!state.rested) return state;
  const moving = [...state.moving, ...frames].slice(-FRAMES_JUDGED);
  const detail = sceneDetailAfter(state.detail, moving);
  return { detail, moving: detail === state.detail ? moving : [], rested: true };
}
