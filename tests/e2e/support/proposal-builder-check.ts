import {
  proposalCheckBlockWords,
  proposalCheckWarningWords,
  proposalCheckWords,
  proposalPartsWords,
  proposalStepNames,
  type Translator,
} from '@heliogrid/i18n';
import type { ProposalCheckState } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { CUSTOMER } from './proposal-document-sample';

/** The check before Generate over the sample deal, a state at a time. */
export type CheckSheet =
  | 'check'
  | 'check-clear'
  | 'check-warn'
  | 'check-generating'
  | 'check-note'
  | 'check-note-missing'
  | 'check-limit';

const amount = (value: number) => `₹${(value / 100).toLocaleString('en-IN')}`;

export function checkState(
  t: Translator['t'],
  sheet: CheckSheet,
  onLog: (line: string) => void,
  cover: ReactNode,
): ProposalCheckState {
  const facts = {
    kind: proposalPartsWords(t, { schemeName: (scheme) => scheme, numberText: String }).kind,
    step: (step: keyof ReturnType<typeof proposalStepNames>) => proposalStepNames(t)[step].title,
    number: String,
    amount,
  };
  const fix = (key: string) => () => onLog(`fix:${key}`);
  const warnings = [
    {
      key: 'panels',
      ...proposalCheckWarningWords(t, facts, {
        check: 'panel_capacity',
        step: 'components',
        fields: [],
        brand: 'Waaree',
        count: 6,
        wattPeak: 579,
        panelKw: 3.47,
        systemKw: 3,
      }),
      onFix: fix('panels'),
    },
  ];
  if (sheet === 'check-limit') return { kind: 'limit' };
  if (sheet === 'check') {
    return {
      kind: 'blocked',
      blocks: [
        {
          key: 'structure',
          ...proposalCheckBlockWords(t, facts, {
            check: 'component_missing',
            step: 'components',
            fields: [],
            category: 'structure',
          }),
          onFix: fix('structure'),
        },
        {
          key: 'tranches',
          ...proposalCheckBlockWords(t, facts, {
            check: 'tranches_not_whole',
            step: 'payment',
            fields: [],
            allocated: 88,
            remainder: 12,
          }),
          onFix: fix('tranches'),
        },
      ],
      warnings,
    };
  }
  return {
    kind: 'clear',
    warnings: sheet === 'check-warn' ? warnings : [],
    summary: {
      cover,
      name: CUSTOMER,
      line: proposalCheckWords(t, { check: { kind: 'checking' }, quick: false }).summaryLine('3'),
      amount: '₹1,90,575',
      facts: proposalCheckWords(t, { check: { kind: 'checking' }, quick: false }).summaryFacts(
        9,
        'English',
        1,
      ),
    },
    ...noteOf(t, sheet, onLog),
    generating: sheet === 'check-generating',
    onGenerate: () => onLog('generate'),
  };
}

/** From version 2 on the clear check asks what changed (`M06-42`); once pressed empty it says so. */
function noteOf(t: Translator['t'], sheet: CheckSheet, onLog: (line: string) => void) {
  if (sheet !== 'check-note' && sheet !== 'check-note-missing') return {};
  const words = proposalCheckWords(t, { check: { kind: 'checking' }, quick: false }).changeNote(2);
  return {
    changeNote: {
      label: words.label,
      hint: words.hint,
      value: '',
      onChange: (text: string) => onLog(`note:${text}`),
      maxLength: 1000,
      ...(sheet === 'check-note-missing' ? { error: words.missing } : {}),
    },
  };
}

export function checkWords(t: Translator['t'], sheet: CheckSheet, quick: boolean) {
  const check =
    sheet === 'check-limit'
      ? ({ kind: 'limit' } as const)
      : sheet === 'check'
        ? ({ kind: 'blocked', blocks: 2, warnings: 1, firstStep: 'Components' } as const)
        : ({
            kind: 'clear',
            warnings: sheet === 'check-warn' ? 1 : 0,
            generating: sheet === 'check-generating',
            pages: 9,
          } as const);
  return proposalCheckWords(t, {
    check,
    quick,
    plan: { counts: { used: 40, limit: 40 }, resetsOn: '1 Dec' },
    planOwner: 'Suresh Kulkarni',
  });
}
