import {
  COMPANY_LOGO_LIMITS,
  COMPANY_PROFILE_PARTS,
  type CompanyProfileFacts,
  type CompanyProfileLife,
  type CompanyProfilePart,
  companyLetterhead,
  companyLogoRefusal,
  companyProfileStanding,
  IN_PACK,
  inLanguage,
  type Read,
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
import { REFUSED_IMAGE } from '../support/company-logo';

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

/**
 * The logo's capture area by state: `off` is a screen that cannot upload yet (the running apps),
 * `empty` no logo, `refused` the image last chosen missed both limits, `held` the profile holds one.
 */
type LogoState = 'off' | 'empty' | 'refused' | 'held';

function factsOf(values: CompanyProfileValues, logo: LogoState): CompanyProfileFacts {
  const { bankName, accountName, accountNumber, bankRoutingIdentifier, taxRegistration, ...rest } =
    values;
  return {
    ...rest,
    logoFileId: logo === 'held' ? 'the-held-logo' : null,
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
/** The page's read as the story's state names it; a failed save follows a read that came. */
function readAs(status: StoryStatus, retry: () => void): Read<null> {
  if (status === 'loading') return { kind: 'loading' };
  if (status === 'unread') return { kind: 'failed', failure: 'refused', retry };
  return { kind: 'ready', value: null };
}

type StoryStatus = 'loading' | 'ready' | 'unread' | 'save-failed';

export function CompanyProfileAsHeld({
  reader,
  life = 'setup',
  titleInBar = false,
  status = 'ready',
  skipped = false,
  saving = false,
  undeclared = false,
  open: openAtStart = 'identity',
  typed = {},
  logo = 'off',
  picture = null,
}: {
  reader: UiLanguage;
  /** Where the profile is met: the setup corridor, or the settings page (`m-settings`, `d-settings`). */
  life?: CompanyProfileLife;
  /** The phone's settings bar holds the title. */
  titleInBar?: boolean;
  status?: StoryStatus;
  skipped?: boolean;
  saving?: boolean;
  /** The step before did not save: what the company sells is still owed. */
  undeclared?: boolean;
  open?: CompanyProfilePart | null;
  typed?: Partial<CompanyProfileValues>;
  logo?: LogoState;
  /** The held logo's picture, where the screen has one. */
  picture?: string | null;
}) {
  const [values, setValues] = useState({
    ...AT_SIGNUP,
    ...(undeclared ? UNDECLARED : {}),
    ...typed,
  });
  const [open, setOpen] = useState(openAtStart);
  const [edits, setEdits] = useState<readonly string[]>([]);
  const [pressed, setPressed] = useState('');
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const { t } = READERS[reader];
  const read = readAs(status, () => setPressed('retry-read'));
  const facts = factsOf(values, logo);
  const standings = Object.fromEntries(
    COMPANY_PROFILE_PARTS.map((part) => [part, companyProfileStanding(part, facts, IN_PACK.tax)]),
  ) as Record<CompanyProfilePart, ReturnType<typeof companyProfileStanding>>;
  return (
    // In settings the page sits in the shell's region, whose side padding the apps give it.
    <div
      lang={reader}
      style={life === 'settings' ? { paddingInline: 'var(--screen-pad-mobile)' } : undefined}
    >
      <ProvenanceWordsProvider value={provenanceWords(t)}>
        <CompanyProfile
          life={life}
          titleInBar={titleInBar}
          words={companyProfileWords(t, {
            life,
            read: read.kind,
            saveFailed: status === 'save-failed',
            skipped,
            arrivedUndeclared: undeclared,
            standings,
            open,
            city: values.city,
            taxIdLabel: IN_PACK.formats.taxIdLabel,
            taxFormat: REGISTRATION === undefined ? '' : inLanguage(REGISTRATION.format, reader),
            bankRoutingLabel: IN_PACK.formats.bankRoutingLabel,
            letterhead: companyLetterhead(facts, IN_PACK.tax),
            logo:
              logo === 'off'
                ? null
                : {
                    limits: COMPANY_LOGO_LIMITS,
                    refusal:
                      logo === 'refused'
                        ? companyLogoRefusal(REFUSED_IMAGE, COMPANY_LOGO_LIMITS)
                        : null,
                    held: logo === 'held',
                  },
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
          read={read}
          onContinueWithout={() => setPressed('continue-without')}
          logoPicture={picture}
          onChooseLogo={(file) => setChosen((list) => [...list, `${file.name}:${file.type}`])}
        />
      </ProvenanceWordsProvider>
      {/* Read by a spec, never drawn: a long report would widen the page it measures. */}
      <div hidden>
        <output data-testid="open">{open ?? ''}</output>
        <output data-testid="edits">{edits.join('|')}</output>
        <output data-testid="pressed">{pressed}</output>
        <output data-testid="chosen">{chosen.join('|')}</output>
        <output data-testid="segment">{values.segment ?? ''}</output>
        <output data-testid="size">
          {values.typicalSystemKwp === null ? '' : String(values.typicalSystemKwp)}
        </output>
      </div>
    </div>
  );
}
