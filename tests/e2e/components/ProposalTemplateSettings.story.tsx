import {
  type DefaultsPart,
  PROPOSAL_SECTIONS,
  type ProposalSection,
  pagesPrinted,
  type Read,
  sectionOfPage,
  type TemplateEdit,
} from '@heliogrid/domain';
import {
  createTranslator,
  proposalDefaultsCovers,
  proposalDefaultsPartWords,
  proposalDefaultsWords,
  proposalStepWords,
  provenanceWords,
} from '@heliogrid/i18n';
import {
  type DefaultsSample,
  type DefaultsViewShape,
  defaultsPartsOf,
  type FocusHandle,
  PageTrail,
  ProposalTemplateSettings,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { useRef, useState } from 'react';
import { DATE_TEXT, SNAPSHOT } from '../support/proposal-document-sample';
import { pageWordsOf } from '../support/proposal-document-words';
import { PLAN_LINES, PLANS } from '../support/proposal-template-sample';

const READERS = { en: await createTranslator('en'), hi: await createTranslator('hi') };

export type DefaultsStoryRead = 'ready' | 'loading' | 'failed';

/** What the story's page holds: the sections that print and the cover picture. */
interface Held {
  readonly sections: readonly ProposalSection[];
  readonly cover: 'home' | 'villa' | 'factory' | 'society' | 'own';
  readonly changed: boolean;
}

const START: Held = { sections: PROPOSAL_SECTIONS, cover: 'home', changed: false };

function held(was: Held, edit: TemplateEdit): Held {
  if (edit.kind === 'section') {
    const on = was.sections.includes(edit.section);
    const sections = on
      ? was.sections.filter((section) => section !== edit.section)
      : [...was.sections, edit.section];
    return { ...was, sections, changed: true };
  }
  if (edit.kind === 'coverPicture') {
    return {
      ...was,
      cover: edit.picture.kind === 'platform' ? edit.picture.key : 'own',
      changed: true,
    };
  }
  return { ...was, changed: true };
}

/**
 * Proposal defaults as its screen mounts it (`SCR-M01-19`, `T-M01-030`): the seven parts over the
 * sample document, a section switched in the page's draft, and the act bar a held change raises.
 */
export function ProposalDefaultsStory({
  wide,
  part: first = 'look',
  read: kind = 'ready',
  reader = 'en',
  saveFailed = false,
  planFailed = false,
  ownPhoto = false,
}: {
  wide: boolean;
  part?: DefaultsPart;
  read?: DefaultsStoryRead;
  reader?: keyof typeof READERS;
  saveFailed?: boolean;
  /** The default plan's save did not land. */
  planFailed?: boolean;
  ownPhoto?: boolean;
}) {
  const { t } = READERS[reader];
  const [part, setPart] = useState<DefaultsPart>(first);
  const [page, setPage] = useState(START);
  const [preview, setPreview] = useState(false);
  const [said, setSaid] = useState('');
  const title = useRef<FocusHandle>(null);
  const words = proposalDefaultsWords(t);
  const snapshot = {
    ...SNAPSHOT,
    pages: pagesPrinted(page.sections),
    fields: {
      ...SNAPSHOT.fields,
      company: {
        ...SNAPSHOT.fields.company,
        coverPicture:
          page.cover === 'own'
            ? ({ kind: 'own', fileId: 'photo' } as const)
            : ({ kind: 'platform', key: page.cover } as const),
      },
    },
  };
  const sample: DefaultsSample = {
    snapshot,
    facts: { dateText: DATE_TEXT, generationTier: 'estimated' },
    words: pageWordsOf(t, snapshot, true),
  };
  const view: DefaultsViewShape = {
    look: { chosen: page.cover },
    record: SNAPSHOT.fields.achievements,
    pages: {
      rows: (
        [
          'cover',
          'about',
          'system',
          'generation',
          'savings',
          'price',
          'timeline',
          'terms',
          'bank',
        ] as const
      ).map((each) => {
        const section = sectionOfPage(each);
        return {
          page: each,
          on: section === null || page.sections.includes(section),
          always: section === null,
        };
      }),
    },
    terms: {
      value: {
        version: 1,
        blocks: [
          { type: 'p', spans: [{ text: 'This proposal is valid for 30 days from its date.' }] },
        ],
      },
    },
    timeline: {
      phases: SNAPSHOT.fields.timeline.map((phase, key) => ({
        key,
        phase: { name: phase.name, description: phase.description },
      })),
    },
  };
  const read: Read<unknown> =
    kind === 'ready'
      ? { kind: 'ready', value: null }
      : kind === 'loading'
        ? { kind: 'loading' }
        : { kind: 'failed', failure: 'no_connection', retry: () => setSaid('retried') };
  const bank = SNAPSHOT.company.bankDetails;
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ProposalTemplateSettings
          wide={wide}
          words={words}
          shared={proposalStepWords(t)}
          read={read}
          part={part}
          onPart={setPart}
          trail={
            <PageTrail
              trail={[{ label: words.settings, onOpen: () => setSaid('settings') }]}
              here={words.title}
              label={words.trail}
            />
          }
          standing={page.changed ? READERS[reader].t({ id: 'Not saved yet' }) : words.note}
          sample={kind === 'ready' ? sample : null}
          {...defaultsPartsOf(view, {
            words: proposalDefaultsPartWords(t, {
              owner: '',
              routingLabel: 'IFSC',
              printsBank: page.sections.includes('bank_details'),
            }),
            covers: proposalDefaultsCovers(t),
            edit: (edit) => setPage((was) => held(was, edit)),
            photo: {
              picture: ownPhoto ? 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' : null,
              held: ownPhoto ? { kind: 'own', fileId: 'photo' } : null,
              storing: false,
              refused: false,
              onChoose: () => setSaid('choose'),
            },
            onOpenBranding: () => setSaid('branding'),
            platformPhases: [],
            onEditPhase: (key) => setSaid(`edit ${key}`),
            onDeletePhase: (key) => setSaid(`delete ${key}`),
            onAddPhase: () => setSaid('add'),
            plans: PLANS,
            changingPlan: false,
            onPlan: (id) => setSaid(`plan ${id}`),
            onNewPlan: () => setSaid('new plan'),
            plan: {
              lines: PLAN_LINES,
              failed: planFailed,
              share: (index, percent) => setSaid(`share ${index} ${percent}`),
              remove: (index) => setSaid(`remove ${index}`),
              add: () => setSaid('add part'),
              reset: () => setSaid('reset plan'),
            },
            bank: {
              details: bank ?? {
                bankName: '',
                accountName: '',
                accountNumber: '',
                bankRoutingIdentifier: '',
              },
              held: bank !== null,
              edit: () => setPage((was) => ({ ...was, changed: true })),
            },
            sample: kind === 'ready' ? sample : null,
          })}
          saveFailed={saveFailed}
          {...(page.changed || saveFailed
            ? {
                act: {
                  saving: false,
                  onSave: () => setPage((was) => ({ ...was, changed: false })),
                  onDiscard: () => setPage(START),
                },
              }
            : {})}
          onDone={() => setSaid('done')}
          previewOpen={preview}
          onPreview={setPreview}
          titleRef={title}
          focusAfter={title}
        />
        <output data-testid="said">{said}</output>
      </div>
    </ProvenanceWordsProvider>
  );
}
