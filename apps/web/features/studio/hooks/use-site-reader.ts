import type { SiteReaders } from '@heliogrid/data/react/studio';

/**
 * The web's readers of the site (`T-M05-002`, part g; `T-M05-002g`), each lane on its own Web
 * Worker, started at its first ask and kept, each answer matched to its ask by number. Roof reads
 * and the line-up are light and each one answers; sunlight, the scan's fits and its mesh are heavy,
 * so a newer ask stops the one before and the light reads never wait behind them. A worker that
 * breaks answers every ask out with its lane's empty answer, and the next ask starts a new one.
 */
type Kind = 'roofs' | 'sunlight' | 'fits' | 'line_up' | 'scan';

function lane(latestOnly: boolean, empty: () => unknown) {
  let worker: Worker | null = null;
  let asked = 0;
  const waiting = new Map<number, (answer: unknown) => void>();
  const stop = () => {
    for (const answer of waiting.values()) answer(empty());
    waiting.clear();
    worker?.terminate();
    worker = null;
  };
  const workerNow = () => {
    if (worker !== null) return worker;
    const started = new Worker(new URL('../site-reads.worker.ts', import.meta.url), {
      type: 'module',
    });
    started.onmessage = (
      message: MessageEvent<{ id: number; answer?: unknown; failed?: true }>,
    ) => {
      const { id, answer, failed } = message.data;
      waiting.get(id)?.(failed ? empty() : answer);
      waiting.delete(id);
    };
    started.onerror = stop;
    worker = started;
    return started;
  };
  return <T>(kind: Kind, input: unknown): Promise<T> =>
    new Promise((answer) => {
      if (latestOnly && waiting.size > 0) stop();
      asked += 1;
      waiting.set(asked, answer as (answer: unknown) => void);
      workerNow().postMessage({ id: asked, kind, input });
    });
}

const roofLane = lane(false, () => ({}));
const sunlightLane = lane(true, () => ({}));
const fitLane = lane(true, () => []);
const lineUpLane = lane(false, () => null);
const scanLane = lane(true, () => null);

export const workerSiteReaders: SiteReaders = {
  roofs: (input) => roofLane('roofs', input),
  sunlight: (input) => sunlightLane('sunlight', input),
  fits: (input) => fitLane('fits', input),
  lineUp: (input) => lineUpLane('line_up', input),
  scan: (layers) => scanLane('scan', layers),
};
