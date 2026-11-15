'use client';
import type { BusinessProfileRead, BusinessProfileWrite } from '@heliogrid/contracts';
import { BANK_FACTS, type BankDetails } from '@heliogrid/domain';
import { useState } from 'react';

/**
 * The company's account as Proposal defaults types it (`T-M01-030`, `M06-17`): held apart from the
 * business profile — its one write-point (`M01-31`) — until the page's *Save* sends it there.
 */

/** The four bank facts as their fields hold them: an empty field is an empty string. */
export interface BankDraft {
  readonly details: BankDetails;
  /** The profile holds whole bank details: the documents have an account to print. */
  readonly held: boolean;
  edit(field: keyof BankDetails, value: string): void;
}

const NO_BANK: BankDetails = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  bankRoutingIdentifier: '',
};

/** The typed facts as the profile takes them: whole, half typed, or none (`M01-31`). */
export function bankWriteOf(
  typed: BankDetails,
): Pick<BusinessProfileWrite, 'bankDetails' | 'bankDetailsTyped'> {
  const facts = BANK_FACTS.map((fact) => typed[fact].trim());
  if (facts.every((fact) => fact !== '')) return { bankDetails: typed, bankDetailsTyped: null };
  if (facts.every((fact) => fact === '')) return { bankDetails: null, bankDetailsTyped: null };
  const orNull = (fact: keyof BankDetails) => (typed[fact].trim() === '' ? null : typed[fact]);
  return {
    bankDetails: null,
    bankDetailsTyped: {
      bankName: orNull('bankName'),
      accountName: orNull('accountName'),
      accountNumber: orNull('accountNumber'),
      bankRoutingIdentifier: orNull('bankRoutingIdentifier'),
    },
  };
}

/** The profile's account as its four fields hold it: whole, half typed, or none yet. */
function bankOf(profile: BusinessProfileRead | undefined): BankDetails {
  if (profile === undefined) return NO_BANK;
  if (profile.bankDetails !== null) return profile.bankDetails;
  const half = profile.bankDetailsTyped ?? null;
  if (half === null) return NO_BANK;
  return {
    bankName: half.bankName ?? '',
    accountName: half.accountName ?? '',
    accountNumber: half.accountNumber ?? '',
    bankRoutingIdentifier: half.bankRoutingIdentifier ?? '',
  };
}

/** The account as typed on this page: held apart from the profile until *Save* sends it. */
export function useBankTyped(profile: BusinessProfileRead | undefined) {
  const [typed, setTyped] = useState<BankDetails | null>(null);
  const stored = bankOf(profile);
  const whole = profile !== undefined && profile.bankDetails !== null;
  return {
    typed,
    changed: typed !== null && BANK_FACTS.some((fact) => typed[fact] !== stored[fact]),
    draft: {
      details: typed ?? stored,
      held: whole,
      edit: (field: keyof BankDetails, value: string) =>
        setTyped((was) => ({ ...(was ?? stored), [field]: value })),
    } satisfies BankDraft,
    drop: () => setTyped(null),
    /** Only the account a save sent is let go: one typed while it was out stays held. */
    sent: (sentBank: BankDetails | null) => setTyped((held) => (held === sentBank ? null : held)),
  };
}
