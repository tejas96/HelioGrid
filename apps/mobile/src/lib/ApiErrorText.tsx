import type { ApiError } from '@heliogrid/data';
import { apiErrorMessageId, apiErrorRef } from '@heliogrid/i18n';
import { theme } from '@heliogrid/tokens/theme';
import { Trans } from '@lingui/react';
import { AppText } from '../ui';

/**
 * Presentation only — copy lives in @heliogrid/i18n src/copy (spec §3.2). <Trans> renders
 * HERE, with the app's own @lingui/react, so the provider instance always matches.
 * Unknown/route-specific codes fall back to the server's human-safe message.
 */
export function ApiErrorText({ error }: { error: ApiError }) {
  const id = apiErrorMessageId(error.code);
  const ref = apiErrorRef(error);
  return (
    // accessibilityLiveRegion is web's role="alert" as close as RN gets — Android announces
    // it, iOS ignores it (an iOS announcement needs AccessibilityInfo at the call site).
    <AppText
      role="body-sm"
      color={theme.colors.danger}
      weight="500"
      accessibilityLiveRegion="polite"
    >
      {id !== undefined ? <Trans id={id} /> : error.message}
      {ref !== undefined ? ` · ${ref}` : null}
    </AppText>
  );
}
