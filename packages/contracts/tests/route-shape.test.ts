import type { AppRoute } from '@ts-rest/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { apiContract, sharedRefusals } from '../src/index';
import { routesOf } from './support/routes';

const ROUTES = routesOf(apiContract);

function pathParamKeys(route: AppRoute): string[] {
  const params = route.pathParams;
  return params instanceof z.ZodObject ? Object.keys(params.shape) : [];
}

/** Whether a request part is a union — read through every wrapper that keeps its keys. */
function isUnion(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodUnion || schema instanceof z.ZodDiscriminatedUnion) return true;
  if (schema instanceof z.ZodIntersection) {
    return isUnion(schema._def.left) || isUnion(schema._def.right);
  }
  if (schema instanceof z.ZodPipeline) return isUnion(schema._def.in) || isUnion(schema._def.out);
  if (schema instanceof z.ZodEffects) return isUnion(schema.innerType());
  if (schema instanceof z.ZodLazy) return isUnion(schema.schema);
  if (schema instanceof z.ZodDefault) return isUnion(schema.removeDefault());
  if (schema instanceof z.ZodCatch) return isUnion(schema.removeCatch());
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodBranded ||
    schema instanceof z.ZodReadonly
  ) {
    return isUnion(schema.unwrap());
  }
  return false;
}

function unionParts(route: AppRoute): string[] {
  const parts = {
    body: 'body' in route ? route.body : undefined,
    query: route.query,
    pathParams: route.pathParams,
  };
  return Object.entries(parts)
    .filter(([, schema]) => schema instanceof z.ZodType && isUnion(schema))
    .map(([part]) => part);
}

const SHARED_REFUSALS = [
  { status: 400, code: 'VALIDATION_FAILED' },
  { status: 403, code: 'FORBIDDEN' },
  { status: 500, code: 'INTERNAL' },
] as const;

function acceptsCode(route: AppRoute, status: number, code: string): boolean {
  const envelope = route.responses[status];
  if (!(envelope instanceof z.ZodType)) return false;
  return envelope.safeParse({ error: { code, message: 'm', requestId: 'r' } }).success;
}

/**
 * Whether a route's own entry at a shared status is only a copy of the shared one: it names that
 * status's shared code and nothing else. A route's entry that adds a code is its own.
 */
function copiesSharedRefusal(route: AppRoute, status: keyof typeof sharedRefusals): boolean {
  const envelope = route.responses[status];
  if (envelope === sharedRefusals[status] || !(envelope instanceof z.ZodObject)) return false;
  const code = envelope.shape.error?.shape?.code;
  const codes =
    code instanceof z.ZodLiteral ? [code.value] : code instanceof z.ZodEnum ? code.options : null;
  const shared = sharedRefusals[status].shape.error.shape.code.value;
  return codes !== null && codes.length === 1 && codes[0] === shared;
}

describe('every route answers only what its contract declares (T-FPLAT-083)', () => {
  it('walks every route of the root contract', () => {
    expect(ROUTES.length).toBeGreaterThan(0);
  });

  it.each(ROUTES)('$name declares every :segment of its path in pathParams', ({ route }) => {
    const segments = (route.path.match(/:[A-Za-z]\w*/g) ?? []).map((segment) => segment.slice(1));
    expect(segments.filter((segment) => !pathParamKeys(route).includes(segment))).toEqual([]);
  });

  it.each(ROUTES)('$name takes no union as its body, query or pathParams', ({ route }) => {
    expect(unionParts(route)).toEqual([]);
  });

  it.each(
    ROUTES.flatMap(({ name, route }) =>
      SHARED_REFUSALS.map(({ status, code }) => ({ name, route, status, code })),
    ),
  )('$name declares the shared $status $code', ({ route, status, code }) => {
    expect(acceptsCode(route, status, code)).toBe(true);
  });

  it.each(
    ROUTES.flatMap(({ name, route }) =>
      SHARED_REFUSALS.map(({ status }) => ({ name, route, status })),
    ),
  )('$name does not copy the shared $status', ({ route, status }) => {
    expect(copiesSharedRefusal(route, status)).toBe(false);
  });
});
