'use client';
import {
  basisPointsToPercent,
  type SubsidyPack,
  subsidyPackOf,
  taxPackOf,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { companyRead } from './shell-reads';
import { useTenantId } from './use-tenant-id';

/** What the builder reads of the market pack: the tax's name and a new battery's tax rate (`F1-13`). */
export interface BuilderMarket {
  /** The tax scheme's identifier — `GST`; empty until the pack is read. */
  readonly taxName: string;
  /** The rate a battery added here takes; `null` until the pack is read. */
  readonly batteryTaxPercent: string | null;
  /** The market's incentive model (`F1-14`); `null` until the pack is read. */
  readonly subsidy: SubsidyPack | null;
}

export function useBuilderMarket(): BuilderMarket {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const company = useQuery(companyRead(repositories, tenantId, tenantId !== ''));
  const marketCode = company.data?.marketCode;
  const pack = useQuery({
    queryKey: queryKeys.market.pack(marketCode ?? ''),
    queryFn: ({ signal }) => repositories.market.currentPack(marketCode ?? '', signal),
    enabled: marketCode !== undefined,
  });
  const tax = taxPackOf(pack.data?.tax);
  const rate = tax?.systemSupplyRates?.battery;
  return {
    taxName: tax?.scheme ?? '',
    batteryTaxPercent: rate === undefined ? null : basisPointsToPercent(rate),
    subsidy: subsidyPackOf(pack.data?.subsidy),
  };
}

/** A switch's next value: flipped from the last one asked for, never from what the control says. */
export function useFlips() {
  const asked = useRef(new Map<string, boolean>());
  return {
    flipped: (key: string, stored: boolean) => {
      const next = !(asked.current.get(key) ?? stored);
      asked.current.set(key, next);
      return next;
    },
    set: (key: string, value: boolean) => asked.current.set(key, value),
  };
}

/** Step 4 fills itself the first time it opens with a place and a size (`T-M06-006`) — once. */
export function useFirstFill(fillable: boolean, fill: () => void) {
  const filled = useRef(false);
  useEffect(() => {
    if (!fillable || filled.current) return;
    filled.current = true;
    fill();
  }, [fillable, fill]);
}

/** The pack's incentive as step 3's switch row names it; `null` where the market offers none. */
export function incentiveSchemeOf(subsidy: SubsidyPack | null) {
  if (subsidy === null || !subsidy.offered) return null;
  return {
    name: subsidy.scheme,
    requiredScheme: subsidy.eligibility.requiredSchemes[0] ?? null,
    paidTo: subsidy.paidTo,
  };
}
