import type { RequestedCompany } from '@heliogrid/contracts';
import type { CompanySignup } from '@heliogrid/data/react';
import { COMPANY_SIGNUP, joinSteerFinding, joinSteerWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, TintedBlock, useFormat } from '@heliogrid/ui';

/**
 * The finding (`M01-09`): the company and its city, and where a request goes — its owner, never
 * a name across the company's boundary (`SCR-M01-02` decision 18).
 */
export function JoinSteerBlock({
  company,
  phoneE164,
}: {
  company: RequestedCompany;
  phoneE164: string;
}) {
  const t = useTranslate();
  const format = useFormat();
  const finding = joinSteerFinding(t, company, format.phone(phoneE164));
  return (
    <TintedBlock
      tone="info"
      title={finding.title}
      body={finding.body}
      className="hg-signup-finding"
    />
  );
}

/**
 * A request that did not go through (`SCR-M01-02` decision 25): `m-error`'s danger block under the
 * heading, while the steer stays whole beneath it. Nothing renders before a failure.
 */
export function JoinFailureBlock({ signup }: { signup: CompanySignup }) {
  const t = useTranslate();
  const { failure } = joinSteerWords(t, signup.requesting === 'failed');
  if (failure === null) return null;
  return (
    <TintedBlock
      tone="danger"
      title={failure.title}
      body={failure.body}
      className="hg-signup-finding"
    />
  );
}

/**
 * Both roads full-size: a steer, not a block (`SCR-M01-02` decision 19). While the request is on
 * its way the join road spins and the other waits, so one press cannot both ask and create
 * (decision 26).
 */
export function JoinRoads({
  company,
  signup,
}: {
  company: RequestedCompany;
  signup: CompanySignup;
}) {
  const t = useTranslate();
  const words = joinSteerWords(t, signup.requesting === 'failed');
  const sending = signup.requesting === 'sending';
  return (
    <div className="hg-signup-join-roads">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={sending}
        spokenName={
          words.failure === null
            ? t(COMPANY_SIGNUP.requestToJoinLabel, { company: company.companyName })
            : undefined
        }
        onClick={() => void signup.requestToJoin()}
      >
        {words.primary}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        disabled={sending}
        onClick={() => void signup.createAnyway()}
      >
        {t(COMPANY_SIGNUP.createAnyway)}
      </Button>
    </div>
  );
}
