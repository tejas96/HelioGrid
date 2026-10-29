import {
  blankItemDraft,
  type ComponentKind,
  IN_CERTIFICATION_SCHEMES,
  type ItemDraft,
  type ItemSpecValue,
  itemDraftAfter,
  judgeItemDraft,
  type SchemeDraft,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  type AddItemCaller,
  catalogAddItemWords,
  catalogItemFailureWords,
  createTranslator,
} from '@heliogrid/i18n';
import { CatalogItemForm } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** One board frame as the add sheet holds it — plain data, so a spec hands it to `mount`. */
export interface ItemFormSetup {
  readonly kind: ComponentKind;
  readonly caller: AddItemCaller;
  readonly brand?: string;
  readonly model?: string;
  readonly spec?: Readonly<Record<string, ItemSpecValue>>;
  readonly schemes?: Readonly<Record<string, SchemeDraft>>;
  readonly price?: string;
  /** The person may write a price; without it there is no Price card. Default `true`. */
  readonly priced?: boolean;
  /** The outright manage grant: the spreadsheet tile. Default `true`. */
  readonly spreadsheet?: boolean;
  readonly copiedFrom?: string;
  readonly loading?: boolean;
  readonly returned?: boolean;
  /** The person pressed the primary: each field the judge refused carries its words. */
  readonly judged?: boolean;
  readonly confirmingDiscard?: boolean;
  /** The create is out. */
  readonly saving?: boolean;
}

const SCHEMES = IN_CERTIFICATION_SCHEMES.schemes;

function draftOf(setup: ItemFormSetup): ItemDraft {
  const blank = blankItemDraft(setup.kind);
  return {
    ...blank,
    brand: setup.brand ?? '',
    model: setup.model ?? '',
    spec: { ...blank.spec, ...setup.spec },
    schemes: setup.schemes ?? {},
    price: setup.price ?? '',
  };
}

/** The judge's verdicts on the draft, in the reader's words, by each field's body path. */
function failuresOf(
  draft: ItemDraft,
  priced: boolean,
  t: (typeof READERS)['en']['t'],
): Record<string, string> {
  const verdict = judgeItemDraft(draft, SCHEMES, { priced });
  if (verdict.ok) return {};
  return Object.fromEntries(
    verdict.failures.map((failure) => [failure.path, catalogItemFailureWords(t, failure)]),
  );
}

/**
 * The add sheet as Catalog settings or a picker holds it, in `reader`'s language, at one board
 * frame; every change goes through the domain's reducer, as the data hook's does. A press reports
 * as `data-acted`.
 */
export function CatalogItemFormAsRead({
  reader,
  setup,
}: {
  reader: UiLanguage;
  setup: ItemFormSetup;
}) {
  const { t } = READERS[reader];
  const priced = setup.priced ?? true;
  const [draft, setDraft] = useState(() => draftOf(setup));
  const [acted, setActed] = useState('');
  /* A press of the primary is a refused send on a judged frame, as the hook counts one. */
  const [refusal, setRefusal] = useState(0);
  const words = catalogAddItemWords(t, {
    kind: draft.kind,
    caller: setup.caller,
    schemes: SCHEMES,
    priced,
    copiedFrom: setup.copiedFrom ?? null,
  });
  const act = (name: string) => () => setActed(name);
  return (
    <div lang={reader} data-acted={acted}>
      <CatalogItemForm
        open
        words={words}
        draft={draft}
        schemes={SCHEMES}
        failures={setup.judged === true ? failuresOf(draft, priced, t) : {}}
        refusal={refusal}
        priced={priced}
        onSpreadsheet={setup.spreadsheet === false ? null : act('spreadsheet')}
        read={setup.loading === true ? { kind: 'loading' } : { kind: 'ready', value: null }}
        saving={setup.saving === true}
        returned={setup.returned === true}
        confirmingDiscard={setup.confirmingDiscard === true}
        onChange={(event) => setDraft((now) => itemDraftAfter(now, event))}
        onSubmit={() => {
          setActed('submit');
          if (setup.judged === true) setRefusal((count) => count + 1);
        }}
        onCancel={act('cancel')}
        onRetry={act('retry')}
        onDismissReturned={act('dismiss')}
        onKeep={act('keep')}
        onDiscard={act('discard')}
      />
    </div>
  );
}
