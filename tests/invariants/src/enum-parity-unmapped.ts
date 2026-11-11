/**
 * pg enums that intentionally have NO contract counterpart yet, each with the reason.
 * A new pg enum that is neither mapped nor listed here FAILS — which forces a conscious
 * decision ("does this cross the wire?") instead of a silent omission.
 */
export const NO_CONTRACT_YET: Record<string, string> = {
  storage_provider: "where a file's bytes live is server-internal; it never crosses the wire",
  usage_metric:
    'billing module not started (full metric enum seeded per the forward-compat register)',
  audit_actor_type: 'audit log is server-internal; never crosses the wire',
  phone_provider: 'telephony module not started (ADR-0019 seams only)',
  phone_number_type: 'telephony module not started',
  cli_series: 'telephony module not started',
  number_status: 'telephony module not started',
  phone_purpose: 'telephony module not started',
  mutation_result: 'offline sync module not started (Track E)',
  checkout_purpose:
    'what a hosted checkout page is for — a conversion or an upgrade’s charge — is server-internal; ' +
    'the page itself is all that crosses the wire (T-M12-003)',
  plan_change_status:
    'a scheduled plan change’s life is server-internal; the billing home sends only the change ' +
    'still scheduled (T-M12-003)',
  tenant_counter_kind:
    'which number series a company counter keeps is server-internal; only the formatted number ' +
    '(PRJ-0042) crosses the wire',
};
