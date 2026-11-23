'use client';
import type { DesignPictureWire } from '@heliogrid/contracts';
import {
  type DesignPictureFileRole,
  type History,
  historyAfter,
  METRES_PER_PLAN_UNIT,
  OWN_PICTURE_REFUSALS,
  type OwnPictureRefusal,
  ownPictureLaid,
  planCentredOnPin,
  planLaid,
  type StudioDocument,
} from '@heliogrid/domain';
import { type MutableRefObject, useRef, useState } from 'react';
import { DataError } from '../errors/errors';
import type { DevicePart, DeviceRead, FirstLay } from '../studio/own-picture-read';
import { useRepositories } from './context';
import { linesAt } from './use-design-picture';

/**
 * Your picture (`T-M05-002d`): a file the person picks, read on the device — or, for a DWG or a
 * binary DXF, on our server — stored with the design and laid on the ground. The device's reader is
 * the platform's (the web reads in a worker); this hook stores what it made, keeps the picture and
 * lays it as one change, so one Undo takes it off.
 */

/** A file as the platform hands it over: its name, and its reading, which may be stopped. */
export interface PictureFile {
  readonly name: string;
  read(signal: AbortSignal): Promise<DeviceRead>;
}

export type OwnPictureJob =
  | { readonly kind: 'idle' }
  | { readonly kind: 'reading'; readonly name: string }
  | {
      readonly kind: 'refused';
      readonly refusal: OwnPictureRefusal;
      readonly distanceKm: number | null;
    };

/** Our server reads a plan in seconds; it is asked again this often, and given up on after this. */
const POLL_MS = 1_500;
const SERVER_READ_MS = 120_000;
const METRES_PER_KM = 1_000;
/** Parts stored at once: enough to fill a phone's link, few enough to keep its memory. */
const PARTS_AT_ONCE = 4;

const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((done, failed) => {
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      failed(signal.reason);
    });
  });

export interface OwnPictureFlow {
  readonly job: OwnPictureJob;
  pick(file: PictureFile): void;
  /** × on the reading pill: the file is let go and the design is as it was. */
  stop(): void;
  /** The refusal seen. */
  dismiss(): void;
}

/** The flow from a picked file to a laid picture. `change` commits; `latest` is the history now. */
export function useOwnPictureFlow(input: {
  readonly designId: string;
  readonly latest: MutableRefObject<History<StudioDocument> | null>;
  readonly change: (next: History<StudioDocument>) => void;
  readonly editable: boolean;
  /** A plan whose unit the file did not name opens the unit card; a photo, the North card. */
  readonly laid: (what: 'photo' | 'drone' | 'placeless' | 'plan' | 'plan-unitless') => void;
}): OwnPictureFlow {
  const { studio, file: files } = useRepositories();
  const [job, setJob] = useState<OwnPictureJob>({ kind: 'idle' });
  const running = useRef<AbortController | null>(null);

  const commit = (next: (present: StudioDocument) => StudioDocument) => {
    const at = input.latest.current;
    if (at !== null) input.change(historyAfter(at, next(at.present)));
  };

  async function storeParts(parts: readonly DevicePart[], signal: AbortSignal) {
    const stored: {
      fileId: string;
      page: number;
      role: DesignPictureFileRole;
      box: DevicePart['box'];
    }[] = [];
    for (let i = 0; i < parts.length; i += PARTS_AT_ONCE) {
      signal.throwIfAborted();
      const batch = parts.slice(i, i + PARTS_AT_ONCE);
      const done = await Promise.all(
        batch.map((part) =>
          files.store({
            subjectKind: 'design',
            subjectRef: input.designId,
            contentType: part.role === 'piece' ? 'image/jpeg' : 'application/json',
            bytes: part.bytes,
          }),
        ),
      );
      done.forEach((file, j) => {
        const part = batch[j] as DevicePart;
        stored.push({ fileId: file.id, page: part.page, role: part.role, box: part.box });
      });
    }
    return stored;
  }

  async function serverRead(
    name: string,
    read: Extract<DeviceRead, { kind: 'server' }>,
    signal: AbortSignal,
  ): Promise<DesignPictureWire> {
    const source = await files.store({
      subjectKind: 'design',
      subjectRef: input.designId,
      contentType: read.contentType,
      bytes: read.bytes,
    });
    let picture = await studio.addCadPlan(input.designId, { name, fileId: source.id });
    const until = Date.now() + SERVER_READ_MS;
    while (picture.state === 'reading' && Date.now() < until) {
      await pause(POLL_MS, signal);
      picture = await studio.picture(input.designId, picture.id, signal);
    }
    return picture;
  }

  /** A plan our server read: its lines fetched and laid on the pin, at its unit or our guess. */
  async function layServerPlan(
    name: string,
    read: Extract<DeviceRead, { kind: 'server' }>,
    signal: AbortSignal,
  ): Promise<OwnPictureJob> {
    const picture = await serverRead(name, read, signal);
    const lines = picture.files.find((part) => part.role === 'lines');
    if (picture.state !== 'ready' || picture.facts === null || lines === undefined) {
      const refusal = picture.refusal === 'no_lines' ? 'no_plan' : 'broken';
      return { kind: 'refused', refusal, distanceKm: null };
    }
    const drawn = await linesAt(lines.url, signal);
    const scale = picture.facts.metresPerUnit;
    // A plan that names no unit lies in our guess from its size, and its unit card opens.
    const metresPerUnit = scale ?? METRES_PER_PLAN_UNIT[picture.facts.unitGuess ?? 'mm'];
    const lay: FirstLay = {
      at: planCentredOnPin(drawn.extent, metresPerUnit),
      turnDeg: 0,
      metresPerUnit,
      scaleFrom: scale === null ? 'guess' : 'file',
    };
    signal.throwIfAborted();
    commit((present) => planLaid(present, { ...lay, pictureId: picture.id }, 1));
    input.laid(scale === null ? 'plan-unitless' : 'plan');
    return { kind: 'idle' };
  }

  /** A file read on the device: its parts stored, the picture kept, and laid. */
  async function layDeviceRead(
    name: string,
    read: Extract<DeviceRead, { kind: 'read' }>,
    signal: AbortSignal,
  ): Promise<OwnPictureJob> {
    const parts = await storeParts(read.parts, signal);
    signal.throwIfAborted();
    const body = { kind: read.pictureKind, name, facts: read.facts, files: parts };
    const picture = await studio.addPicture(input.designId, body);
    signal.throwIfAborted();
    const laid = { ...read.lay, pictureId: picture.id };
    if (read.pictureKind === 'plan') {
      commit((present) => planLaid(present, laid, read.facts.pickedPage));
      const unitless = read.facts.unit === null && read.facts.unitGuess !== null;
      input.laid(unitless ? 'plan-unitless' : 'plan');
      return { kind: 'idle' };
    }
    commit((present) => ownPictureLaid(present, laid));
    if (read.pictureKind === 'photo') input.laid('photo');
    else input.laid(read.facts.centre === null ? 'placeless' : 'drone');
    return { kind: 'idle' };
  }

  async function run(file: PictureFile, signal: AbortSignal): Promise<OwnPictureJob> {
    const read = await file.read(signal);
    if (read.kind === 'server') return layServerPlan(file.name, read, signal);
    if (read.kind === 'read') return layDeviceRead(file.name, read, signal);
    const distanceKm = read.distanceM === undefined ? null : read.distanceM / METRES_PER_KM;
    // The reader is another thread: a reason this build does not know reads as a broken file.
    const known = (OWN_PICTURE_REFUSALS as readonly string[]).includes(read.refusal);
    return { kind: 'refused', refusal: known ? read.refusal : 'broken', distanceKm };
  }

  return {
    job,
    pick(file) {
      if (!input.editable) return;
      running.current?.abort();
      const controller = new AbortController();
      running.current = controller;
      setJob({ kind: 'reading', name: file.name });
      void run(file, controller.signal)
        .catch((error: unknown): OwnPictureJob => {
          if (controller.signal.aborted) return { kind: 'idle' };
          const offline = error instanceof DataError && error.retryable;
          return {
            kind: 'refused',
            refusal: offline ? 'no_connection' : 'broken',
            distanceKm: null,
          };
        })
        .then((ended) => {
          if (running.current === controller) setJob(ended);
        });
    },
    stop() {
      running.current?.abort();
      running.current = null;
      setJob({ kind: 'idle' });
    },
    dismiss: () => setJob({ kind: 'idle' }),
  };
}
