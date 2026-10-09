'use client';
import type { CreateTenant, RequestedCompany } from '@heliogrid/contracts';
import type { JoinSteer, WriteFailure } from '@heliogrid/domain';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, isUnanswered } from '../errors/errors';
import type { TenantRepository } from '../tenant/repository';
import { useDataLayer } from './context';

/**
 * Where the company step's one write stands: `creating` while the three values are being
 * written — facts, not fields, for the moment — then, the values still in the fields, `failed`
 * when the server answered no and nothing was created, or `unreached` when no answer came and the
 * company may exist (`SCR-M01-02` `m-error`, `m-not-reached`).
 */
export type CompanyCreation = 'idle' | 'creating' | WriteFailure;

/** Where a request to join stands: on its way, refused with nothing sent, or unanswered (`M01-09`). */
export type JoinRequesting = 'idle' | 'sending' | WriteFailure;

/** How a write ended without landing, or `null` while it has not. */
export function failureOf(state: CompanyCreation | JoinRequesting): WriteFailure | null {
  return state === 'failed' || state === 'unreached' ? state : null;
}

const failureFrom = (error: unknown): WriteFailure =>
  isUnanswered(error) ? 'unreached' : 'failed';

export interface CompanySignup {
  readonly creation: CompanyCreation;
  /** *Create company* is looking for a company with these details — a read, so nothing is being written yet. */
  readonly checking: boolean;
  /** Where the join steer stands; the screen hands it to `signupView`. */
  readonly steer: JoinSteer;
  readonly requesting: JoinRequesting;
  /** The company the steer names, then the one the request went to — as it is stored. */
  readonly found: RequestedCompany | null;
  /** The name typed on the company step, which the request carries — the account has none yet. */
  readonly typedName: string | null;
  /**
   * *Create company*: a company with this name and city steers to joining it; otherwise the
   * company is created. The steer is advice, so a check that fails creates as before (`M01-09`).
   */
  submit(input: CreateTenant): Promise<void>;
  /** *Create a new company anyway* and *Create your own company instead*: the details last submitted. */
  createAnyway(): Promise<void>;
  /**
   * *Request to join*, with the details last submitted. A company that no longer matches (404)
   * returns to the plain company step, since asking again cannot reach it.
   */
  requestToJoin(): Promise<void>;
  /** A detail changed under the steer: back to the plain company step. */
  dismissSteer(): void;
}

/** The company step as a screen consumes it (Law 11): the store writes, this reports the wait, the steer and the refusal. */
export function useCompanySignup(): CompanySignup {
  const { session, repositories } = useDataLayer();
  const [creation, setCreation] = useState<CompanyCreation>('idle');
  const [checking, setChecking] = useState(false);
  const [steer, setSteer] = useState<JoinSteer>('none');
  const [requesting, setRequesting] = useState<JoinRequesting>('idle');
  const [found, setFound] = useState<RequestedCompany | null>(null);
  const [details, setDetails] = useState<CreateTenant | null>(null);

  const create = useCallback(
    async (input: CreateTenant) => {
      setSteer('none');
      setCreation('creating');
      try {
        await session.createCompany(input);
      } catch (error) {
        setCreation(failureFrom(error));
      }
    },
    [session],
  );

  const submit = useCallback(
    async (input: CreateTenant) => {
      setDetails(input);
      setChecking(true);
      const match = await firstMatch(repositories.tenant, input);
      setChecking(false);
      if (match === null) return create(input);
      setFound(match);
      setSteer('offered');
    },
    [repositories.tenant, create],
  );

  const createAnyway = useCallback(async () => {
    if (details !== null) await create(details);
  }, [details, create]);

  const requestToJoin = useCallback(async () => {
    if (details === null) return;
    setRequesting('sending');
    try {
      setFound(
        await repositories.tenant.joinRequest({
          companyName: details.companyName,
          city: details.city,
          name: details.ownerName,
        }),
      );
      setSteer('sent');
      setRequesting('idle');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        setSteer('none');
        setRequesting('idle');
      } else {
        setRequesting(failureFrom(error));
      }
    }
  }, [details, repositories.tenant]);

  const dismissSteer = useCallback(() => {
    setSteer('none');
    setRequesting('idle');
  }, []);

  return useMemo(
    () => ({
      creation,
      checking,
      steer,
      requesting,
      found,
      typedName: details?.ownerName ?? null,
      submit,
      createAnyway,
      requestToJoin,
      dismissSteer,
    }),
    [
      creation,
      checking,
      steer,
      requesting,
      found,
      details,
      submit,
      createAnyway,
      requestToJoin,
      dismissSteer,
    ],
  );
}

/**
 * A detail changed under the steer drops it (`M01-09`): the steer was about what was typed. Both
 * company steps call this with their form's change subscription, so the rule is written once.
 */
export function useSteerDroppedOnEdit(
  signup: CompanySignup,
  onEdit: (changed: () => void) => { unsubscribe(): void },
): void {
  const offered = signup.steer === 'offered';
  const { dismissSteer } = signup;
  useEffect(() => {
    if (!offered) return;
    const watching = onEdit(dismissSteer);
    return () => watching.unsubscribe();
  }, [offered, onEdit, dismissSteer]);
}

/** The oldest company with these details, or none — a check that cannot be made steers nowhere. */
async function firstMatch(
  tenants: TenantRepository,
  input: CreateTenant,
): Promise<RequestedCompany | null> {
  try {
    const [match] = await tenants.similar(input.companyName, input.city);
    return match === undefined ? null : { companyName: match.companyName, city: match.city };
  } catch {
    return null;
  }
}
