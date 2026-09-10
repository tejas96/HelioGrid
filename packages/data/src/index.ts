/**
 * @heliogrid/data — the frontend SDK (ADR-0023). The ONLY data path for apps/web and
 * apps/mobile. This entry is framework-free: no React, no React Query, usable from a route
 * handler or a script. The React adapter is `@heliogrid/data/react`; a Next server render
 * uses `@heliogrid/data/server`, which is request-scoped for a reason its own file explains.
 *
 * `createApiClient`, `createTransport`, `createRepositoryRegistry`, `createHealthRepository`,
 * `normalizeClientError` and `toApiError` are deliberately NOT exported. `createDataLayer` is
 * the only construction entry an app gets from here — re-exporting the client or transport
 * factory would hand apps back the raw wire that the `apps-never-touch-the-wire` gate exists
 * to keep away from them.
 */
export type { AuditRepository } from './audit/repository';
export type { AuthRepository } from './auth/repository';
export { queryKeys } from './cache/keys';
export type { DataLayer, DataLayerConfig, Repositories } from './data-layer';
export { createDataLayer } from './data-layer';
export type { ApiErrorDetail } from './errors/errors';
export {
  ApiError,
  DataError,
  InvalidResponseError,
  NetworkError,
  RequestCancelledError,
  RequestTimeoutError,
  UnauthorizedError,
} from './errors/errors';
export type { HealthRepository } from './health/repository';
export type { InvitationRepository } from './invitation/repository';
export { hasCompany, homeOf } from './session/company';
export type { DoorView } from './session/door-view';
export { doorView } from './session/door-view';
export type { HeldWork, HeldWorkSummary } from './session/held-work';
export { NO_HELD_WORK } from './session/held-work';
export type { SignupView } from './session/signup-view';
export { signupView } from './session/signup-view';
export type {
  KnownAccount,
  OtpVerifyResult,
  PendingSwitch,
  SessionApi,
  SessionPhase,
  SessionSnapshot,
  SessionStatus,
  SessionStore,
  SessionUser,
  SignInDoor,
} from './session/types';
export type { SimilarTenant, TenantRepository } from './tenant/repository';
export type { TokenStorage } from './transport/storage';
export type { UserRepository } from './user/repository';
