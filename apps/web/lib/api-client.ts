'use client';
import { apiContract } from '@heliogrid/contracts';
import { initQueryClient } from '@ts-rest/react-query';
import { API_URL } from './auth-client';

/**
 * THE typed client — every product API call goes through this (contract-checked at
 * compile time; a backend/frontend shape mismatch is a build error, not a runtime bug).
 * Session rides the first-party cookie on the api origin.
 */
export const api = initQueryClient(apiContract, {
  baseUrl: API_URL,
  baseHeaders: {},
  credentials: 'include',
});
