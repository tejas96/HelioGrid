import type { ProposalVersionSummary, VersionInForcePreview } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { ProposalVersionsProps, PutInForceSheetProps } from './ProposalVersions.types';

/** Each fact's mark on its change row; a fact a newer server learned takes the plain layers mark. */
const FACT_GLYPH: Readonly<Record<string, ShellGlyphName | undefined>> = {
  payable: 'rupee',
  discount: 'scales',
  capacity: 'solar-panel',
  system_type: 'bolt',
  battery: 'battery',
  panels: 'grid',
  inverters: 'inverter',
  other_parts: 'package',
  incentive: 'download',
  yearly_generation: 'sun',
  yearly_saving: 'trend-up',
  payment_plan: 'wallet',
  timeline: 'calendar-clock',
  terms: 'document',
  maintenance: 'wrench',
  emi_example: 'credit-card',
  cover: 'building',
  proposal_type: 'briefcase',
  about: 'star',
  client: 'user',
  bank: 'credit-card',
};

export function versionFactGlyph(fact: string): ShellGlyphName {
  return FACT_GLYPH[fact] ?? 'layers';
}

/** What a version's row offers: share the newest unshared one, put a newer one in force, else view. */
export type VersionRowAct = 'share' | 'put_in_force' | 'view';

export function versionRowAct(
  version: { readonly sharedAt: string | null; readonly inForce: boolean },
  facts: {
    readonly newest: boolean;
    readonly won: boolean;
    readonly mayShare: boolean;
    readonly mayPutInForce: boolean;
  },
): VersionRowAct {
  if (!facts.newest) return 'view';
  if (facts.won) return facts.mayPutInForce && !version.inForce ? 'put_in_force' : 'view';
  return facts.mayShare && version.sharedAt === null ? 'share' : 'view';
}

/** A version's one act as a button: its look, its word and what it calls. */
export function versionActOf(
  props: ProposalVersionsProps,
  version: ProposalVersionSummary,
  newest: boolean,
) {
  const { words } = props;
  const act = versionRowAct(version, { ...props, newest });
  const size = 'md' as const;
  if (act === 'share') {
    return {
      label: words.share,
      sends: true,
      button: { variant: 'primary' as const, size, onClick: () => props.onShare(version.version) },
    };
  }
  if (act === 'put_in_force') {
    return {
      label: words.putInForce,
      sends: false,
      button: {
        variant: 'primary' as const,
        size,
        onClick: () => props.onPutInForce(version.version),
      },
    };
  }
  return {
    label: words.view,
    sends: false,
    button: { variant: 'secondary' as const, size, onClick: () => props.onView(version.version) },
  };
}

/** One part of the plan a version in force would leave: a new part, or one already settled. */
export function inForcePartOf(
  words: PutInForceSheetProps['words'],
  part: VersionInForcePreview['plan'][number],
  plan: VersionInForcePreview['plan'],
) {
  const text = words.part(part, plan);
  return {
    amount: text.amount,
    /** A kept part's state as a chip beside its amount: paid in full, or in part. */
    chip:
      text.state === null
        ? null
        : {
            label: text.state,
            tone: part.state === 'paid' ? ('success' as const) : ('warning' as const),
          },
    row: { title: text.name, line: text.line ?? undefined },
  };
}

/** The Put-in-force sheet's frame on both halves: its read, and no way out while it sends. */
export function inForceSheetOf(props: PutInForceSheetProps) {
  const { words, sending } = props;
  return {
    open: props.open,
    onClose: () => {
      if (!sending) props.onClose();
    },
    closeLabel: words.close,
    title: words.title,
    dismissible: !sending,
    read: props.preview,
    loadingLabel: words.loading,
    errorTitle: words.failedTitle,
    errorMessage: words.failedMessage,
    retryLabel: words.retry,
  };
}
