import { apiContract } from '@heliogrid/contracts';

/**
 * tenant_id never travels in a request body or query — it derives from the session
 * context server-side (.claude/rules/contracts.md; docs/08). A contract schema carrying
 * it invites the client to assert its own tenant, the exact spoof RLS exists to stop.
 *
 * Static: walks the ts-rest router tree, unwraps common Zod wrappers, and asserts no
 * object schema under `body` or `query` declares a tenant_id / tenantId key. Runs even
 * without DATABASE_URL — nothing here needs a database.
 */
const BANNED_KEYS = ['tenant_id', 'tenantId'];

type ZodLike = { _def?: { typeName?: string; schema?: ZodLike; innerType?: ZodLike } } & {
  shape?: Record<string, unknown>;
};

function unwrap(schema: ZodLike | undefined): ZodLike | undefined {
  let current = schema;
  for (let i = 0; i < 10 && current?._def; i += 1) {
    const inner = current._def.schema ?? current._def.innerType;
    if (!inner) return current;
    current = inner;
  }
  return current;
}

function isRoute(node: Record<string, unknown>): boolean {
  return typeof node.method === 'string' && typeof node.path === 'string';
}

/** The banned keys one route declares, across its body and query schemas. */
function routeProblems(node: Record<string, unknown>, prefix: string): string[] {
  const where = `${String(node.method)} ${String(node.path)}`;
  return (['body', 'query'] as const).flatMap((part) => {
    const shape = unwrap(node[part] as ZodLike | undefined)?.shape;
    if (!shape) return [];
    return Object.keys(shape)
      .filter((key) => BANNED_KEYS.includes(key))
      .map((key) => `${prefix}.${part} declares "${key}" (${where})`);
  });
}

/** Pure walker, exported so the gate can be probed against a fabricated router. */
export function findTenantIdKeys(router: unknown, prefix = 'apiContract'): string[] {
  if (router === null || typeof router !== 'object') return [];
  const node = router as Record<string, unknown>;
  if (isRoute(node)) return routeProblems(node, prefix);
  return Object.entries(node).flatMap(([key, child]) =>
    findTenantIdKeys(child, `${prefix}.${key}`),
  );
}

/** Routes carrying a body or query schema — the population this invariant can actually judge. */
function countJudgeableRoutes(router: unknown): number {
  if (router === null || typeof router !== 'object') return 0;
  const node = router as Record<string, unknown>;
  if (isRoute(node)) {
    return unwrap(node.body as ZodLike | undefined)?.shape ||
      unwrap(node.query as ZodLike | undefined)?.shape
      ? 1
      : 0;
  }
  return Object.values(node).reduce<number>((sum, child) => sum + countJudgeableRoutes(child), 0);
}

export function runTenantIdInBody(): void {
  const problems = findTenantIdKeys(apiContract);
  if (problems.length > 0) {
    throw new Error(
      `tenant-id-in-body: tenant identity must come from session context, never the wire:\n  ${problems.join('\n  ')}`,
    );
  }
  const judged = countJudgeableRoutes(apiContract);
  if (judged === 0) {
    // Same honesty as the greenfield banner in run.ts: with no body/query schema in the
    // contract there is nothing to compare, so passing means nothing. Real coverage
    // arrives with the first module contract that takes a payload.
    console.warn(
      'tenant-id-in-body VACUOUS: no contract route declares a body or query schema yet',
    );
    return;
  }
  console.log(
    `tenant-id-in-body: no contract body/query declares tenant identity (${judged} routes checked)`,
  );
}
