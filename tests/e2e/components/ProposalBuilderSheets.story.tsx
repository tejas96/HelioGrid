import { type ComponentLine, PROPOSAL_LIMITS } from '@heliogrid/domain';
import {
  createTranslator,
  proposalPartAddWords,
  proposalPartEditWords,
  proposalPartPickerWords,
  proposalPaymentPartWords,
  proposalPhaseSheetWords,
  proposalReadyWords,
  proposalStartWords,
  provenanceWords,
  type Translator,
} from '@heliogrid/i18n';
import {
  type PartOption,
  ProposalCheckSheet,
  ProposalPartAdd,
  ProposalPartEdit,
  ProposalPartPicker,
  ProposalPaymentPartSheet,
  ProposalPhaseSheet,
  ProposalReady,
  ProposalStartSheet,
  ProvenanceWordsProvider,
  ScaledProposalPage,
  type StartMode,
} from '@heliogrid/ui';
import { useState } from 'react';
import { type CheckSheet, checkState, checkWords } from '../support/proposal-builder-check';
import { type BuilderCase, FIRST_NAME } from '../support/proposal-builder-sample';
import { DATE_TEXT, NUMBER, SNAPSHOT } from '../support/proposal-document-sample';
import { pageWordsOf } from '../support/proposal-document-words';

export type StorySheet =
  | 'steps'
  | 'preview'
  | 'picker'
  | 'edit'
  | 'add'
  | 'phase'
  | 'part'
  | 'start'
  | CheckSheet
  | null;

const en = await createTranslator('en');

const PANELS: readonly Omit<PartOption, 'picked'>[] = [
  { key: 'waaree', brand: 'Waaree', line: '550 Wp · TOPCon · 25-year warranty', mark: 'DCR' },
  {
    key: 'adani',
    brand: 'Adani Solar',
    line: '545 Wp · Mono PERC · 25-year warranty',
    mark: 'DCR',
  },
  {
    key: 'vikram',
    brand: 'Vikram Solar',
    line: '540 Wp · Mono PERC · 27-year warranty',
    mark: 'DCR',
  },
  { key: 'longi', brand: 'LONGi', line: '555 Wp · HJT · 25-year warranty' },
];

function cover(t: Translator['t'], width: number, number?: string) {
  return (
    <ScaledProposalPage
      page="cover"
      width={width}
      snapshot={SNAPSHOT}
      facts={{ dateText: DATE_TEXT, generationTier: 'estimated', ...(number ? { number } : {}) }}
      words={pageWordsOf(t, SNAPSHOT, number === undefined)}
      still
    />
  );
}

const isCheck = (sheet: StorySheet): sheet is CheckSheet => sheet?.startsWith('check') === true;

/** The builder's sheets over the sample deal: the story names which is open. */
/** The stages a business deal's part may fall due on: the claim stage is not among them (`T-M06-009`). */
const PART_STAGES = [
  { value: 'won', label: 'On signing' as never },
  { value: 'installation', label: 'On installation' as never },
  { value: 'handed_over', label: 'On handover' as never },
];

export function BuilderSheets({
  t = en.t,
  sheet,
  onSheet,
  kase = 'drawn',
  quick = false,
  addsParts = true,
  canDesign = true,
  onLog,
}: {
  t?: Translator['t'];
  sheet: StorySheet;
  onSheet: (sheet: StorySheet) => void;
  kase?: BuilderCase;
  quick?: boolean;
  /** The reader may add a part inline (`rights.addsParts`): the picker then offers it. */
  addsParts?: boolean;
  /** The reader may design: the start sheet offers *With 3D design*. */
  canDesign?: boolean;
  onLog: (line: string) => void;
}) {
  const [picked, setPicked] = useState<readonly string[]>(['waaree']);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<StartMode>('quick');
  const max = PROPOSAL_LIMITS.brandsPerCategory;
  const options = PANELS.filter((option) =>
    option.brand.toLowerCase().includes(search.toLowerCase()),
  ).map((option) => ({ ...option, picked: picked.includes(option.key) }));
  const line = SNAPSHOT.fields.components.find(
    (candidate): candidate is ComponentLine => candidate.category === 'panel',
  );
  const check = isCheck(sheet) ? sheet : null;
  return (
    <>
      <ProposalPartPicker
        open={sheet === 'picker'}
        onClose={() => onSheet(null)}
        words={proposalPartPickerWords(t, {
          category: 'panel',
          picked: picked.length,
          max,
          scheme: 'DCR',
          canAdd: addsParts,
        })}
        options={options}
        search={search}
        onSearch={setSearch}
        full={picked.length >= max}
        onToggle={(key) =>
          setPicked(picked.includes(key) ? picked.filter((one) => one !== key) : [...picked, key])
        }
        onEdit={() => onSheet('edit')}
        {...(addsParts ? { onAdd: () => onSheet('add') } : {})}
      />
      <ProposalPartEdit
        open={sheet === 'edit'}
        onClose={() => onSheet('picker')}
        words={proposalPartEditWords(t, { brand: line?.brand ?? '', category: 'panel' })}
        line={line ?? null}
        onDone={(done) => {
          onLog(`edited:${done.description ?? ''}`);
          onSheet('picker');
        }}
      />
      <ProposalPartAdd
        open={sheet === 'add'}
        onClose={() => onSheet('picker')}
        words={proposalPartAddWords(t, { category: 'panel', scheme: 'DCR' })}
        category="panel"
        saving={false}
        onSave={(part) => onLog(`added:${part.brand}`)}
        {...(kase === 'owner' ? { onSpreadsheet: () => onLog('spreadsheet') } : {})}
      />
      <ProposalPhaseSheet
        open={sheet === 'phase'}
        onClose={() => onSheet(null)}
        words={proposalPhaseSheetWords(t, { number: 1 })}
        phase={SNAPSHOT.fields.timeline[0] ?? null}
        onDone={(phase) => onLog(`phase:${phase.name}`)}
      />
      <ProposalPaymentPartSheet
        open={sheet === 'part'}
        onClose={() => onSheet(null)}
        words={proposalPaymentPartWords(t, { number: 5, isNew: true })}
        part={{ label: 'Part 5', dueOnStage: 'handed_over' }}
        stages={PART_STAGES}
        onDone={(part) => onLog(`part:${part.label}:${part.dueOnStage}`)}
      />
      <ProposalStartSheet
        open={sheet === 'start'}
        onClose={() => onSheet(null)}
        words={proposalStartWords(t, { name: FIRST_NAME, segment: 'residential' })}
        mode={mode}
        onMode={setMode}
        canDesign={canDesign}
        sources={[
          {
            id: 'a',
            title: proposalStartWords(t, { name: FIRST_NAME, segment: 'residential' }).sameAs(
              'Meena Deshpande',
            ),
            line: '5 kW · ₹3,10,000 · sent 4 days ago' as never,
          },
          {
            id: 'b',
            title: proposalStartWords(t, { name: FIRST_NAME, segment: 'residential' }).sameAs(
              'Rohan Kale',
            ),
            line: '3 kW · ₹1,88,000 · accepted' as never,
          },
        ]}
        onCopy={(id) => onLog(`copy:${id}`)}
        onStart={() => onLog(`start:${mode}`)}
        starting={false}
      />
      <ProposalCheckSheet
        open={check !== null}
        onClose={() => onSheet(null)}
        words={checkWords(t, check ?? 'check-clear', quick)}
        state={check === null ? { kind: 'checking' } : checkState(t, check, onLog, cover(t, 92))}
      />
    </>
  );
}

/** One sheet alone, open, with what it reported. */
export function SheetStory({
  sheet,
  kase = 'drawn',
  addsParts = true,
  canDesign = true,
}: {
  sheet: StorySheet;
  kase?: BuilderCase;
  addsParts?: boolean;
  canDesign?: boolean;
}) {
  const [open, setOpen] = useState<StorySheet>(sheet);
  const [log, setLog] = useState('');
  return (
    <ProvenanceWordsProvider value={provenanceWords(en.t)}>
      <output data-testid="log">{log}</output>
      <BuilderSheets
        sheet={open}
        onSheet={setOpen}
        kase={kase}
        addsParts={addsParts}
        canDesign={canDesign}
        onLog={setLog}
      />
    </ProvenanceWordsProvider>
  );
}

/** The screen after Generate. */
export function ReadyStory({ wide = false }: { wide?: boolean }) {
  const [log, setLog] = useState('');
  const { t } = en;
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      <div data-testid="frame" style={{ height: wide ? 900 : 844 }}>
        <ProposalReady
          wide={wide}
          words={proposalReadyWords(t, {
            name: FIRST_NAME,
            number: NUMBER,
            version: 1,
            amount: '₹1,90,575',
            pages: 9,
          })}
          cover={cover(t, wide ? 360 : 210, NUMBER)}
          onShare={() => setLog('share')}
          onDownload={() => setLog('download')}
          onBack={() => setLog('back')}
        />
        <output data-testid="log">{log}</output>
      </div>
    </ProvenanceWordsProvider>
  );
}
