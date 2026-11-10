import pinoHttp from 'pino-http';
import { pinoHttpOptions } from '../../src/common/logging';

/** The api's root logger, with its redaction and serialisers, writing each line into `lines`. */
export function theAppsLogger() {
  const lines: Record<string, unknown>[] = [];
  const destination = { write: (line: string) => void lines.push(JSON.parse(line)) };
  // pino-http deletes the options it consumes, so it is handed a copy.
  const { logger } = pinoHttp({ ...pinoHttpOptions }, destination);
  return { logger, lines };
}
