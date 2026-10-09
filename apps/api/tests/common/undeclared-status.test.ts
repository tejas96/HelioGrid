import type { ArgumentsHost } from '@nestjs/common';
import {
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';
import { ContractException } from '../../src/common/errors/contract-exception';
import { EnvelopeExceptionFilter } from '../../src/common/filters/envelope-exception.filter';

/**
 * A thrown status is held to the route that threw it (`T-FPLAT-083`): ts-rest checks only what a
 * handler RETURNS, so the filter is the one place a thrown status meets the contract. A status the
 * matched route declares — its own, or a shared 400, 403 or 500 — answers as thrown; one it
 * does not declare answers the opaque 500, and the log names the route and the status.
 */

interface Answer {
  status: number;
  code: string;
}

function answerOf(exception: unknown, method: string, routePath: string | undefined) {
  const logger = new PinoLogger({ pinoHttp: { level: 'silent' } });
  const logged = vi.spyOn(logger, 'error');
  const answer: Partial<Answer> = {};
  const res = {
    setHeader: () => res,
    status: (status: number) => {
      answer.status = status;
      return res;
    },
    json: (body: { error: { code: string } }) => {
      answer.code = body.error.code;
      return res;
    },
  };
  const req = {
    method,
    headers: {},
    route: routePath === undefined ? undefined : { path: routePath },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  } as unknown as ArgumentsHost;
  new EnvelopeExceptionFilter(logger).catch(exception, host);
  return { answer, logged: logged.mock.calls.map(([fields]) => fields) };
}

describe('a thrown status is one its route declares (T-FPLAT-083)', () => {
  it.each([
    {
      why: 'a 404 the route declares answers as thrown',
      exception: new NotFoundException(),
      route: ['GET', '/market-packs/:marketCode'],
      expected: { status: 404, code: 'NOT_FOUND' },
    },
    {
      why: 'a route literal the route declares keeps its code',
      exception: new ContractException(
        'ACCESS_REMOVED',
        'Your access was removed.',
        HttpStatus.UNAUTHORIZED,
      ),
      route: ['POST', '/auth/refresh'],
      expected: { status: 401, code: 'ACCESS_REMOVED' },
    },
    {
      why: 'a shared 403 answers on a route that declares no 403 of its own',
      exception: new ForbiddenException('This needs a company.'),
      route: ['POST', '/auth/otp/request'],
      expected: { status: 403, code: 'FORBIDDEN' },
    },
    {
      why: 'a request no route matched answers as thrown',
      exception: new NotFoundException(),
      route: ['GET', undefined],
      expected: { status: 404, code: 'NOT_FOUND' },
    },
  ] as const)('$why', ({ exception, route: [method, path], expected }) => {
    const { answer, logged } = answerOf(exception, method, path);
    expect(answer).toEqual(expected);
    expect(logged).toEqual([]);
  });

  it.each([
    {
      why: 'a 404 the route does not declare answers the opaque 500',
      exception: new NotFoundException('This account no longer exists.'),
      route: ['PATCH', '/users/me'],
      undeclaredStatus: 404,
    },
    {
      why: 'a 401 a public route does not declare answers the opaque 500',
      exception: new UnauthorizedException(),
      route: ['GET', '/health'],
      undeclaredStatus: 401,
    },
  ] as const)(
    '$why, and the log names the route and the status',
    ({ exception, route: [method, path], undeclaredStatus }) => {
      const { answer, logged } = answerOf(exception, method, path);
      expect(answer).toEqual({ status: 500, code: 'INTERNAL' });
      expect(logged).toEqual([
        expect.objectContaining({ undeclaredStatus, route: `${method} ${path}` }),
      ]);
    },
  );
});
