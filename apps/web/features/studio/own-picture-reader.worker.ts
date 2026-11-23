/// <reference lib="webworker" />
import { type DeviceRead, dxfRead, readerOf, toServer } from '@heliogrid/data';
import { READ_TAG } from './own-picture-read-tag';
import { readDrone } from './read-drone';
import { readPdf } from './read-pdf';
import { readPhoto } from './read-photo';

/**
 * Your picture's reader (`T-M05-002d`), off the page's thread, so the studio never hangs while a
 * 600 MB drone map or a many-page PDF is read. `readerOf` picks the reader by the file's name; what it
 * made goes back with its bytes handed over, never copied.
 */

type Pin = { latitude: number; longitude: number };

async function readFile(file: File, pin: Pin): Promise<DeviceRead> {
  switch (readerOf(file.name)) {
    case 'photo':
      return readPhoto(file);
    case 'drone':
      return readDrone(file, pin);
    case 'pdf':
      return readPdf(file);
    case 'dxf':
      return dxfRead(new Uint8Array(await file.arrayBuffer()));
    case 'dwg':
      return toServer(new Uint8Array(await file.arrayBuffer()), 'image/vnd.dwg');
    default:
      return { kind: 'refused', refusal: 'not_a_picture' };
  }
}

self.onmessage = async (message: MessageEvent<{ file: File; pin: Pin }>) => {
  const read = await readFile(message.data.file, message.data.pin).catch(
    (): DeviceRead => ({ kind: 'refused', refusal: 'broken' }),
  );
  const handed =
    read.kind === 'read'
      ? read.parts.map((part) => part.bytes.buffer)
      : read.kind === 'server'
        ? [read.bytes.buffer]
        : [];
  // Tagged: pdf.js's parser, loaded into this worker, speaks on the same port.
  self.postMessage({ [READ_TAG]: read }, { transfer: handed as Transferable[] });
};
