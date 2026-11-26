import { vi } from 'vitest';

/** The answers part g's source tests make: a service answering each ask in turn by its path. */

export const status = { ok: 200, serverError: 500 } as const;
export const sangli = { latitude: 16.836668, longitude: 74.596606 };

export type Answer = { status: number; body?: unknown; bytes?: Uint8Array };

/** Every ask the stubbed service took, in order. */
export const asked: URL[] = [];

/** The service answering each ask in turn by its path; an ask with no answer left is a 500. */
export function answering(byPath: Record<string, Answer[]>) {
  asked.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (address: string | URL) => {
      const url = new URL(address);
      asked.push(url);
      const queue = byPath[url.pathname] ?? [];
      const answer = queue.shift() ?? { status: status.serverError };
      if (answer.bytes !== undefined) return new Response(answer.bytes, { status: answer.status });
      return new Response(JSON.stringify(answer.body ?? {}), { status: answer.status });
    }),
  );
}
