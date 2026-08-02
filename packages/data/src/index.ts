/**
 * @heliogrid/data — the frontend SDK (ADR-0023). The ONLY data path for apps/web and
 * apps/mobile. This entry is framework-free: no React, no React Query, usable from a Next
 * server component or a script. The React adapter is `@heliogrid/data/react`.
 *
 * `createApiClient`, `createTransport`, `createHealthRepository` and `toApiError` are
 * deliberately NOT exported. `createDataLayer` is the only construction entry an app gets —
 * re-exporting the client factory would hand apps back the raw wire that the
 * `apps-never-touch-the-wire` gate exists to keep away from them.
 */
export { queryKeys } from './cache/keys';
export type { DataLayer, DataLayerConfig, Repositories } from './data-layer';
export { createDataLayer } from './data-layer';
export type { ApiErrorDetail } from './errors/errors';
export { ApiError, UnauthorizedError } from './errors/errors';
export type { HealthRepository } from './health/repository';
export type {
  OtpResult,
  SessionApi,
  SessionSnapshot,
  SessionStatus,
  SessionStore,
  SessionUser,
} from './session/types';
export type { TokenStorage } from './transport/storage';
