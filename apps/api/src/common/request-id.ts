import { randomUUID } from 'node:crypto';
import { REQUEST_ID_HEADER } from '@heliogrid/contracts';
import type { NextFunction, Request, Response } from 'express';

export { REQUEST_ID_HEADER };

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function safeRequestId(value: unknown): string | undefined {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value) ? value : undefined;
}

export function resolveRequestId(value: unknown): string {
  return safeRequestId(value) ?? randomUUID();
}

/** Runs before CORS and body parsing so every response, including a parser 413, has an ID. */
export function assignRequestId(req: Request, res: Response, next: NextFunction): void {
  const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
  req.id = requestId;
  req.headers[REQUEST_ID_HEADER] = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
