'use client';
import type { ApiError } from '@heliogrid/data';
import { apiErrorMessageId, apiErrorRef } from '@heliogrid/i18n';
import { Trans } from '@lingui/react';
import './api-error-text.css';

/**
 * Presentation only — copy lives in @heliogrid/i18n src/copy (spec §3.2). <Trans> renders
 * HERE, with the app's own @lingui/react, so the provider instance always matches.
 * Unknown/route-specific codes fall back to the server's human-safe message.
 */
export function ApiErrorText({ error }: { error: ApiError }) {
  const id = apiErrorMessageId(error.code);
  const ref = apiErrorRef(error);
  return (
    <p className="api-error-text" role="alert">
      {id !== undefined ? <Trans id={id} /> : error.message}
      {ref !== undefined ? ` · ${ref}` : null}
    </p>
  );
}
