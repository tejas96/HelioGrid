import type { SiteReaders } from '@heliogrid/data/react/studio';

/**
 * The web's readers of the site (`T-M05-002`, part g), each on its own Web Worker, started at its
 * first ask and kept, each answer matched to its ask by number. Roof reads are light and each one
 * answers; sunlight is heavy, so a newer ask stops the one before and the roof reads never wait
 * behind it. A worker that breaks answers every ask out empty, and the next ask starts a new one.
 */
type Answer = (answer: Record<string, never>) => void;

function lane(latestOnly: boolean) {
  let worker: Worker | null = null;
  let asked = 0;
  const waiting = new Map<number, Answer>();
  const stop = () => {
    for (const answer of waiting.values()) answer({});
    waiting.clear();
    worker?.terminate();
    worker = null;
  };
  const workerNow = () => {
    if (worker !== null) return worker;
    const started = new Worker(new URL('../site-reads.worker.ts', import.meta.url), {
      type: 'module',
    });
    started.onmessage = (message: MessageEvent<{ id: number; answer: Record<string, never> }>) => {
      waiting.get(message.data.id)?.(message.data.answer);
      waiting.delete(message.data.id);
    };
    started.onerror = stop;
    worker = started;
    return started;
  };
  return <T>(kind: 'roofs' | 'sunlight', input: unknown): Promise<T> =>
    new Promise((answer) => {
      if (latestOnly && waiting.size > 0) stop();
      asked += 1;
      waiting.set(asked, answer as Answer);
      workerNow().postMessage({ id: asked, kind, input });
    });
}

const roofLane = lane(false);
const sunlightLane = lane(true);

export const workerSiteReaders: SiteReaders = {
  roofs: (input) => roofLane('roofs', input),
  sunlight: (input) => sunlightLane('sunlight', input),
};
