import {
  formatMoney,
  IN_FORMATS,
  type Read,
  type TrancheEdit,
  trancheCardsOf,
  trancheDraftOf,
  trancheEdit,
  tranchePreviewLines,
  trancheRefusals,
  trancheVerdictOf,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  allocationRefusal,
  allocationSentence,
  createTranslator,
  paymentTermsSavedLine,
  paymentTermsWords,
  provenanceWords,
  stageWords,
} from '@heliogrid/i18n';
import {
  PaymentTermsEditor,
  PaymentTermsFoot,
  PaymentTermsList,
  PaymentTermsPicker,
  PaymentTermsPickerFoot,
  ProvenanceWordsProvider,
  TERMS_PREVIEW,
  termsCardsOf,
  termsFootOf,
  termsLinesOf,
  termsPreviewOf,
  termsStagesOf,
} from '@heliogrid/ui';
import { ARCHIVED, IN_USE, LETTERHEAD, scheduleOf } from '../support/payment-terms-sample';

const TRANSLATORS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

const noop = () => undefined;

/** What a spec asks the page to hold: a frame of `SCR-M01-20`, as plain words and ids. */
export interface TermsFrame {
  reader: UiLanguage;
  wide: boolean;
  list?: 'loading' | 'unread' | 'seeded' | 'archived' | 'none-archived';
  /** The template whose editor is open, and the edits made to it since. */
  open?: string;
  edits?: TrancheEdit[];
  /** The tranche whose stage is being picked. */
  picking?: number;
  saveFailed?: boolean;
  /** The preview's answer has not come. */
  previewLoading?: boolean;
  /** What *Try again* on the failed list asks. */
  onRetry?: () => void;
}

/**
 * The Payment terms page body as a screen composes it: the list, and beside it (1536) or under
 * it (375, standing in for the sheet) the editor with its foot, or the stage picker.
 */
export function PaymentTermsAsHeld(frame: TermsFrame) {
  const { t } = TRANSLATORS[frame.reader];
  const words = paymentTermsWords(t);
  const context = {
    words,
    language: frame.reader,
    vocabulary: IN_FORMATS.vocabulary,
    stages: stageWords(t),
    money: (amount: string) => formatMoney(IN_FORMATS, amount),
  };
  const list = listOf(frame);
  const saved = list.templates.find((one) => one.id === frame.open) ?? null;
  const draft =
    saved === null
      ? null
      : (frame.edits ?? []).reduce(trancheEdit, trancheDraftOf(saved, frame.reader));
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      <div lang={frame.reader} style={{ padding: '0 var(--screen-pad-mobile)' }}>
        <PaymentTermsList
          words={words}
          read={list.read}
          {...(frame.wide ? { title: words.title } : {})}
          savedLine={paymentTermsSavedLine(t, list.standing, { date: () => '22 Aug 2026' })}
          teaching={list.seeded}
          archived={list.archived}
          archivedCount={list.archivedCount}
          cards={termsCardsOf(list.shown, frame.open ?? null, context)}
          columns={frame.wide ? 2 : 1}
          onOpen={noop}
          onAdd={noop}
          onToggleArchived={noop}
          onRestore={noop}
        />
        {saved === null || draft === null ? null : (
          <section aria-label={words.edit(draft.name.shown)}>
            {frame.picking === undefined ? (
              <EditorFrame frame={frame} saved={saved} draft={draft} t={t} context={context} />
            ) : (
              <PickerFrame picking={frame.picking} draft={draft} context={context} />
            )}
          </section>
        )}
      </div>
    </ProvenanceWordsProvider>
  );
}

/** The list's read as the frame names it. */
function readOf(list: TermsFrame['list'], retry: () => void): Read<null> {
  if (list === 'loading') return { kind: 'loading' };
  if (list === 'unread') return { kind: 'failed', failure: 'refused', retry };
  return { kind: 'ready', value: null };
}

/** The list a frame holds: the seeded pair, or the board's six in use and two archived. */
function listOf(frame: TermsFrame) {
  const seeded = frame.list === 'seeded';
  const templates = seeded ? IN_USE.slice(0, 2) : [...IN_USE, ...ARCHIVED];
  const cards = trancheCardsOf(templates);
  const archived = frame.list === 'archived' || frame.list === 'none-archived';
  const read = readOf(frame.list, frame.onRetry ?? noop);
  return {
    templates,
    seeded,
    archived,
    read,
    archivedCount: seeded ? 0 : cards.archived.length,
    shown: frame.list === 'none-archived' ? [] : archived ? cards.archived : cards.inUse,
    standing: seeded
      ? ({ kind: 'never-set' } as const)
      : ({
          kind: 'saved',
          at: Date.parse('2026-08-22T10:00:00Z'),
          name: 'Rajesh Kulkarni',
        } as const),
  } as const;
}

type Draft = ReturnType<typeof trancheDraftOf>;
type Context = Parameters<typeof termsLinesOf>[3];

function EditorFrame({
  frame,
  saved,
  draft,
  t,
  context,
}: {
  frame: TermsFrame;
  saved: (typeof IN_USE)[number];
  draft: Draft;
  t: (typeof TRANSLATORS)['en']['t'];
  context: Context;
}) {
  const { words } = context;
  const verdict = trancheVerdictOf(draft);
  return (
    <>
      <PaymentTermsEditor
        words={words}
        letterhead={LETTERHEAD}
        preview={termsPreviewOf(previewOf(saved, draft, frame.previewLoading), context)}
        previewHeight={frame.wide ? TERMS_PREVIEW.cardHeight : TERMS_PREVIEW.sheetHeight}
        name={draft.name.shown}
        onName={noop}
        lines={termsLinesOf(draft, trancheRefusals(draft), false, context)}
        canAdd
        canRemove={draft.lines.length > 1}
        onLineName={noop}
        onLineShare={noop}
        onRemove={noop}
        onPickStage={noop}
        onAdd={noop}
        standing={saved.isDefault ? 'default' : 'other'}
        onMakeDefault={noop}
        onArchive={noop}
        acting={null}
      />
      <PaymentTermsFoot
        words={words}
        {...termsFootOf(draft, verdict)}
        sentence={allocationSentence(t, verdict)}
        {...refusalOf(allocationRefusal(t, verdict))}
        saving={false}
        saveFailed={frame.saveFailed === true}
        onSave={noop}
        onCancel={noop}
      />
    </>
  );
}

function PickerFrame({
  picking,
  draft,
  context,
}: {
  picking: number;
  draft: Draft;
  context: Context;
}) {
  const line = draft.lines.find((one) => one.key === picking);
  return (
    <>
      <PaymentTermsPicker
        words={context.words}
        label={context.words.whenDue(line?.label.shown ?? '')}
        stages={termsStagesOf(draft, picking, context)}
        value={line?.dueOnStage ?? 'won'}
        onChange={noop}
      />
      <PaymentTermsPickerFoot words={context.words} onDone={noop} />
    </>
  );
}

function previewOf(saved: (typeof IN_USE)[number], draft: Draft, loading: boolean | undefined) {
  const lines = tranchePreviewLines(saved, draft);
  if (lines === null) return null;
  const schedule = loading === true ? null : scheduleOf(lines.lines.map((one) => one.percent));
  return { ...lines, schedule };
}

function refusalOf(refusal: string | null) {
  return refusal === null ? {} : { refusal };
}
