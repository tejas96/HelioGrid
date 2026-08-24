/**
 * Phone display formatting. Digits never translate, so the grouping is locale-independent
 * — which is exactly what makes it safe to share.
 */

/** Indian NSN display grouping: 5+5. Input is the 10-digit national number, no country code. */
export const formatPhoneNsn = (nsn: string) => `${nsn.slice(0, 5)} ${nsn.slice(5)}`;
