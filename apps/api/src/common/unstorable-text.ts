import { httpStatusFor } from '@heliogrid/contracts';
import type { NextFunction, Request, Response } from 'express';

/** No Postgres text column can hold this character; storing one is an opaque 500. */
const NUL = '\u0000';

/**
 * The schema-field path of every string under `value` that holds a NUL, as `details[]` names it.
 * Bytes are no text: a webhook's raw body is verified as bytes, and walking a megabyte of them one
 * entry at a time would spend the server on every unsigned post.
 */
export function nulPaths(value: unknown, path: readonly string[] = []): string[] {
  if (typeof value === 'string') return value.includes(NUL) ? [path.join('.')] : [];
  if (value === null || typeof value !== 'object' || ArrayBuffer.isView(value)) return [];
  return Object.entries(value).flatMap(([key, inner]) => nulPaths(inner, [...path, key]));
}

/**
 * Refuses a body or query string holding a NUL character as a field-addressed 400 before any
 * route reads it — once for every route, so a new route is covered with no line of its own. A
 * webhook's raw body is a Buffer and passes untouched: it is verified as bytes, never stored as text.
 */
export function refuseUnstorableText(req: Request, res: Response, next: NextFunction): void {
  const paths = [...nulPaths(req.body), ...nulPaths(req.query)];
  if (paths.length === 0) {
    next();
    return;
  }
  res.status(httpStatusFor('VALIDATION_FAILED')).json({
    error: {
      code: 'VALIDATION_FAILED',
      message: 'Some fields need attention.',
      details: paths.map((path) => ({ path, issue: 'Contains a character that cannot be saved.' })),
      requestId: String(req.id),
    },
  });
}
