import {
  COMPANY_PROFILE_PARTS,
  type CompanyProfileFacts,
  type CompanyProfilePart,
  companyLetterhead,
  companyProfileStanding,
  IN_PACK,
  inLanguage,
  type UiLanguage,
} from '@heliogrid/domain';
import { companyProfileWords, createTranslator, provenanceWords } from '@heliogrid/i18n';
import {
  CompanyProfile,
  type CompanyProfileField,
  type CompanyProfileValues,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * A company as the two steps before leave it (`SCR-M01-05`, `m-default`): the name and the city
 * from signup, the kind of business and the typical size from the step before, nothing added.
 */
const AT_SIGNUP: CompanyProfileValues = {
  companyName: 'Suryodaya Solar Solutions Pvt Ltd',
  city: 'Pune',
  address: '',
  postalCode: '',
  taxRegistration: '',
  bankName: '',
  accountName: 'Suryodaya Solar Solutions Pvt Ltd',
  accountNumber: '',
  bankRoutingIdentifier: '',
  segment: 'residential',
  typicalSystemKwp: 5,
};

/** The step before did not save (`m-failed-save`): neither answer is held. */
const UNDECLARED = { segment: null, typicalSystemKwp: null } as const;

const [REGISTRATION] = IN_PACK.tax.registrationTypes;

function factsOf(values: CompanyProfileValues): CompanyProfileFacts {
  const { bankName, accountName, accountNumber, bankRoutingIdentifier, taxRegistration, ...rest } =
    values;
  return {
    ...rest,
    registrations:
      REGISTRATION === undefined
        ? []
        : [{ registrationType: REGISTRATION.type, value: taxRegistration }],
    bank: { bankName, accountName, accountNumber, bankRoutingIdentifier },
  };
}

/**
 * The company profile as a screen holds it: what is typed, which part is open and what was pressed
 * live here, in the browser; where each part stands is domain's answer and the words are
 * `companyProfileWords`' in the reader's language, with the India pack's three labels. The words
 * are built while the component renders, so they cannot come through `mount`.
 */
export function CompanyProfileAsHeld({
  reader,
  status = 'ready',
  skipped = false,
  saving = false,
  undeclared = false,
  open: openAtStart = 'identity',
  typed = {},
}: {
  reader: UiLanguage;
  status?: 'loading' | 'ready' | 'unread' | 'save-failed';
  skipped?: boolean;
  saving?: boolean;
  /** The step before did not save: what the company sells is still owed. */
  undeclared?: boolean;
  open?: CompanyProfilePart | null;
  typed?: Partial<CompanyProfileValues>;
}) {
  const [values, setValues] = useState({
    ...AT_SIGNUP,
    ...(undeclared ? UNDECLARED : {}),
    ...typed,
  });
  const [open, setOpen] = useState(openAtStart);
  const [edits, setEdits] = useState<readonly string[]>([]);
  const [pressed, setPressed] = useState('');
  const { t } = READERS[reader];
  const facts = factsOf(values);
  const standings = Object.fromEntries(
    COMPANY_PROFILE_PARTS.map((part) => [part, companyProfileStanding(part, facts, IN_PACK.tax)]),
  ) as Record<CompanyProfilePart, ReturnType<typeof companyProfileStanding>>;
  return (
    <div lang={reader}>
      <ProvenanceWordsProvider value={provenanceWords(t)}>
        <CompanyProfile
          words={companyProfileWords(t, {
            status,
            skipped,
            arrivedUndeclared: undeclared,
            standings,
            open,
            city: values.city,
            taxIdLabel: IN_PACK.formats.taxIdLabel,
            taxFormat: REGISTRATION === undefined ? '' : inLanguage(REGISTRATION.format, reader),
            bankRoutingLabel: IN_PACK.formats.bankRoutingLabel,
            letterhead: companyLetterhead(facts, IN_PACK.tax),
          })}
          values={values}
          open={open}
          onOpen={setOpen}
          onEdit={(field: CompanyProfileField, value: string) => {
            setValues((held) => ({ ...held, [field]: value }));
            setEdits((list) => [...list, `${field}=${value}`]);
          }}
          onChooseSegment={(segment) => setValues((held) => ({ ...held, segment }))}
          onDeclareSize={(typicalSystemKwp) => setValues((held) => ({ ...held, typicalSystemKwp }))}
          saving={saving}
          onSave={() => setPressed('save')}
          onRetryRead={() => setPressed('retry-read')}
          onContinueWithout={() => setPressed('continue-without')}
        />
      </ProvenanceWordsProvider>
      {/* Read by a spec, never drawn: a long report would widen the page it measures. */}
      <div hidden>
        <output data-testid="open">{open ?? ''}</output>
        <output data-testid="edits">{edits.join('|')}</output>
        <output data-testid="pressed">{pressed}</output>
        <output data-testid="segment">{values.segment ?? ''}</output>
        <output data-testid="size">
          {values.typicalSystemKwp === null ? '' : String(values.typicalSystemKwp)}
        </output>
      </div>
    </div>
  );
}
