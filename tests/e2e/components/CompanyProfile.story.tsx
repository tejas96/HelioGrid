import {
  COMPANY_PROFILE_PARTS,
  type CompanyProfileFacts,
  type CompanyProfilePart,
  companyProfileStanding,
  IN_PACK,
  inLanguage,
  type UiLanguage,
} from '@heliogrid/domain';
import { companyProfileWords, createTranslator } from '@heliogrid/i18n';
import { CompanyProfile, type CompanyProfileField, type CompanyProfileValues } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** A company as signup leaves it (`SCR-M01-05`, `m-default`): the name and the city, nothing added. */
const AT_SIGNUP: CompanyProfileValues = {
  companyName: 'Suryodaya Solar Solutions Pvt Ltd',
  city: 'Pune',
  address: '',
  postalCode: '',
  bankName: '',
  accountName: 'Suryodaya Solar Solutions Pvt Ltd',
  accountNumber: '',
  bankRoutingIdentifier: '',
};

function factsOf(values: CompanyProfileValues, undeclared: boolean): CompanyProfileFacts {
  const { bankName, accountName, accountNumber, bankRoutingIdentifier, ...rest } = values;
  return {
    ...rest,
    registrations: [],
    bank: { bankName, accountName, accountNumber, bankRoutingIdentifier },
    segment: undeclared ? null : 'residential',
    typicalSystemKwp: 5,
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
  const [values, setValues] = useState({ ...AT_SIGNUP, ...typed });
  const [open, setOpen] = useState(openAtStart);
  const [edits, setEdits] = useState<readonly string[]>([]);
  const [pressed, setPressed] = useState('');
  const { t } = READERS[reader];
  const facts = factsOf(values, undeclared);
  const [registration] = IN_PACK.tax.registrationTypes;
  const standings = Object.fromEntries(
    COMPANY_PROFILE_PARTS.map((part) => [part, companyProfileStanding(part, facts, IN_PACK.tax)]),
  ) as Record<CompanyProfilePart, ReturnType<typeof companyProfileStanding>>;
  return (
    <div lang={reader}>
      <CompanyProfile
        words={companyProfileWords(t, {
          status,
          skipped,
          standings,
          open,
          city: values.city,
          taxIdLabel: IN_PACK.formats.taxIdLabel,
          taxFormat: registration === undefined ? '' : inLanguage(registration.format, reader),
          bankRoutingLabel: IN_PACK.formats.bankRoutingLabel,
        })}
        values={values}
        open={open}
        onOpen={setOpen}
        onEdit={(field: CompanyProfileField, value: string) => {
          setValues((held) => ({ ...held, [field]: value }));
          setEdits((list) => [...list, `${field}=${value}`]);
        }}
        saving={saving}
        onSave={() => setPressed('save')}
        onRetryRead={() => setPressed('retry-read')}
        onContinueWithout={() => setPressed('continue-without')}
      />
      <output data-testid="open">{open ?? ''}</output>
      <output data-testid="edits">{edits.join('|')}</output>
      <output data-testid="pressed">{pressed}</output>
    </div>
  );
}
