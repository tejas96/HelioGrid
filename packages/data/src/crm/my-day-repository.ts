import type { MyDay } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt } from '../errors/errors';

/** My Day (`SCR-M07-01`): my open tasks on the active leads I can see, banded and ordered. */
export interface MyDayRepository {
  read(signal?: AbortSignal): Promise<MyDay>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createMyDayRepository(api: ApiClient): MyDayRepository {
  return {
    read: (signal) => bodyAt(() => api.myDay.read({ fetchOptions: { signal } }), 200),
  };
}
