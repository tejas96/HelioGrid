import type { DeviceRead } from '@heliogrid/data';
import type { PictureFile } from '@heliogrid/data/react';
import { READ_TAG } from '../own-picture-read-tag';

/**
 * The web's half of Your picture (`T-M05-002d`): a picked file read in a worker of its own, let go
 * the moment the person stops it or it answers.
 */
export function pickedFileOf(
  file: File,
  pin: { latitude: number; longitude: number },
): PictureFile {
  return {
    name: file.name,
    read: (signal) =>
      new Promise<DeviceRead>((answer, fail) => {
        const worker = new Worker(new URL('../own-picture-reader.worker.ts', import.meta.url), {
          type: 'module',
        });
        const done = () => worker.terminate();
        signal.addEventListener('abort', () => {
          done();
          fail(signal.reason);
        });
        worker.onmessage = (message: MessageEvent<Record<string, unknown> | null>) => {
          // pdf.js's parser speaks on the same port as the reader: only the reader's answer counts.
          const read = message.data?.[READ_TAG] as DeviceRead | undefined;
          if (read === undefined) return;
          done();
          answer(read);
        };
        worker.onerror = () => {
          done();
          answer({ kind: 'refused', refusal: 'broken' });
        };
        worker.postMessage({ file, pin });
      }),
  };
}
