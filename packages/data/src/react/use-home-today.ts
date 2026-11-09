'use client';
import {
  billingStripAudienceOf,
  type DayPart,
  dayPart,
  opensSettingsRow,
  type Read,
  type SetupReadiness,
  setupReadiness,
} from '@heliogrid/domain';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRepositories } from './context';
import {
  paymentTermsFactRead,
  pendingInvitesFactRead,
  profileFactRead,
  profileFacts,
  registrationsFactRead,
  releasesFactRead,
  templateFactRead,
} from './home-reads';
import { readOf } from './read';
import { billingHomeRead } from './use-billing-strip';
import { useSession } from './use-session';
import { useSidebar } from './use-sidebar';
import { membersRead } from './use-team';

/** The small facts Home shows at a glance, each read where its own page reads it. */
export interface HomeGlance {
  readonly trialDaysLeft: number | null;
  readonly catalogItems: number | null;
  readonly people: number | null;
  /** Voice minutes this cycle, the Owner's alone (the billing home carries the meters). */
  readonly voice: { readonly used: number; readonly included: number | null } | null;
}

/**
 * Home's own facts, as both shells read them (Law 11): where the company stands before its first
 * proposal — only the steps this person's presets open, `null` when they open none — and the
 * small facts at a glance. Every read shares its page's key, so a save there moves Home too.
 */
export interface HomeToday {
  readonly readiness: Read<SetupReadiness> | null;
  readonly glance: HomeGlance;
  /** The person's name as the session holds it, for the greeting. */
  readonly personName: string;
  /** The part of the day on the device when Home opened, for the greeting. */
  readonly dayPart: DayPart;
}

export function useHomeToday(): HomeToday {
  const repositories = useRepositories();
  const { user } = useSession();
  const { counts } = useSidebar();
  const [part] = useState(() => {
    const now = new Date();
    return dayPart(now.getHours() + now.getMinutes() / 60);
  });
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles ?? [];
  const reading = tenantId !== '';
  const opens = (row: Parameters<typeof opensSettingsRow>[1]) =>
    reading && opensSettingsRow(roles, row);
  const company = opens('company_profile') || opens('branding');
  const profile = useQuery(profileFactRead(repositories, tenantId, company));
  const registrations = useQuery(registrationsFactRead(repositories, tenantId, company));
  const releases = useQuery(releasesFactRead(repositories, tenantId, opens('catalog')));
  const terms = useQuery(paymentTermsFactRead(repositories, tenantId, opens('payment_terms')));
  const template = useQuery(templateFactRead(repositories, tenantId, opens('proposal_templates')));
  const members = useQuery(membersRead(repositories, tenantId, opens('team')));
  const invites = useQuery(pendingInvitesFactRead(repositories, tenantId, opens('team')));
  const owner = reading && billingStripAudienceOf(roles) === 'owner';
  const billing = useQuery(billingHomeRead(repositories, tenantId, owner));

  const steps = setupReadiness(roles, {
    profile: profileFacts(profile.data, registrations.data),
    releases: releases.data ?? null,
    paymentTemplates: terms.data?.items.filter((t) => !t.archived).length ?? null,
    templateOwn: template.data === undefined ? null : (template.data.changed ?? null) !== null,
    people: members.data?.length ?? null,
    invites: invites.data ?? null,
  });
  const out: readonly [UseQueryResult<unknown>, boolean][] = [
    [profile, company],
    [registrations, company],
    [releases, opens('catalog')],
    [terms, opens('payment_terms')],
    [template, opens('proposal_templates')],
    [members, opens('team')],
    [invites, opens('team')],
  ];
  const voice = billing.data?.usage.find((meter) => meter.meter === 'voice_minutes');
  return {
    readiness: steps.total === 0 ? null : readinessRead(out, steps),
    glance: {
      trialDaysLeft: counts.trialDaysLeft,
      catalogItems: counts.catalogItems,
      people: counts.people,
      voice: voice === undefined ? null : { used: voice.used, included: voice.included },
    },
    personName: user?.name ?? '',
    dayPart: part,
  };
}

/**
 * Loading while any fact this person's steps need is still out — the hero never counts a step it
 * has not judged — then ready; a fact that failed leaves its step unjudged and the rest stand.
 */
function readinessRead(
  queries: readonly (readonly [UseQueryResult<unknown>, boolean])[],
  steps: SetupReadiness,
): Read<SetupReadiness> {
  const out = queries.some(([query, asked]) => asked && readOf(query).kind === 'loading');
  return out ? { kind: 'loading' } : { kind: 'ready', value: steps };
}
