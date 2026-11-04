import type { TranslatedText } from '@heliogrid/contracts';
import { Banner } from '../Banner';
import { BillingValueText } from '../BillingStrip/BillingValue';
import { Block } from '../Block';
import { Button } from '../Button';
import { Derivation } from '../Derivation';
import { EditorSurface } from '../EditorSurface';
import { FactRow, FactRows } from '../FactRow';
import { LoadingBars } from '../LoadingBars';
import { MoneySummary } from '../MoneySummary';
import { Provenance } from '../Provenance';
import { SheetActions } from '../Sheet';
import { moneyOf } from './PlanReview.logic';
import type { PlanReviewProps, PlanReviewRow, PlanReviewSection } from './PlanSelection.types';
import type { PlanSelectionWords } from './PlanSelection.words';

/**
 * The review (decision 6), the consent surface (`M12-49`): a sheet that rises from the act at 375,
 * the side panel at 1536, never parked open and empty. While the act's answer is out its button
 * shows `loading`, and close and every way out wait for it.
 */
export function PlanReview({
  open,
  layout,
  view,
  words,
  acting,
  onClose,
  onConfirm,
}: PlanReviewProps) {
  return (
    <EditorSurface
      open={open && view !== null}
      onClose={acting ? undefined : onClose}
      closeLabel={words.close}
      showClose
      dismissible={!acting}
      modal={layout === 'column'}
      desktop="panel"
      size="auto"
      density="expressive"
      title={words.review}
      subtitle={view?.subtitle}
      footer={
        view?.act == null ? undefined : (
          <div className="hg-plans-review-foot">
            <SheetActions>
              <Button fullWidth loading={acting} disabled={acting} onClick={onConfirm}>
                {view.act.label}
              </Button>
            </SheetActions>
            {view.act.line === null ? null : (
              <span className="hg-plans-review-line">{view.act.line}</span>
            )}
          </div>
        )
      }
    >
      {view === null ? null : (
        <div className="hg-plans-review">
          {view.changed === null ? null : <Banner kind="state" title={view.changed} />}
          {view.failure === null ? null : (
            <Banner kind="state" tone="danger" title={view.failure} />
          )}
          {view.sections.map((section) => (
            <Section key={section.key} section={section} words={words} />
          ))}
        </div>
      )}
    </EditorSurface>
  );
}

function Rows({ label, rows }: { label: TranslatedText; rows: readonly PlanReviewRow[] }) {
  return (
    <FactRows label={label} density="expressive" form="lead">
      {rows.map((row) => (
        <FactRow
          key={row.key}
          label={row.label}
          value={
            <span className="hg-plans-review-value" data-amount={row.amount ? 'true' : undefined}>
              <BillingValueText value={row.value} />
            </span>
          }
          provenance={row.mark === null ? undefined : { note: row.mark, size: 12 }}
        />
      ))}
    </FactRows>
  );
}

function Section({ section, words }: { section: PlanReviewSection; words: PlanSelectionWords }) {
  switch (section.kind) {
    case 'facts':
      return (
        <div className="hg-plans-review-group">
          {section.overline === null ? null : (
            <span className="hg-plans-review-overline">{section.overline}</span>
          )}
          <Rows label={section.label} rows={section.rows} />
          {section.source === null ? null : <Provenance source={section.source} size={12} />}
        </div>
      );
    case 'blocked':
      return (
        <Banner kind="cap" title={section.title}>
          <Rows label={section.title} rows={section.rows} />
        </Banner>
      );
    case 'money':
      return (
        <div className="hg-plans-review-group">
          {/* A payment prints to the paisa (`F1-07`): `MoneySummary` prints minor units to the minor unit. */}
          <MoneySummary
            equation={moneyOf(section)}
            words={words.moneySummary}
            overline={words.whatYouPayToday}
            payableLabel={words.totalToday}
            surface="screen"
            density="expressive"
            provenance={
              section.source === null ? undefined : { tier: 'unmarked', source: section.source }
            }
          />
          {section.working === null ? null : (
            <Derivation
              summary={words.howWorkedOut}
              label={section.working.label}
              kindWords={words.derivationKinds}
              parts={section.working.parts.map((part) => ({
                kind: part.kind,
                label: part.label,
                text: <BillingValueText value={part.value} />,
              }))}
            />
          )}
        </div>
      );
    case 'loading':
      return <LoadingBars label={section.label} bars={['panel', 'row']} />;
    case 'failed':
      return (
        <Block
          title={section.title}
          density="expressive"
          read={{ kind: 'failed', retry: section.retry }}
          loadingLabel={section.title}
          errorTitle={section.errorTitle}
          errorMessage={section.errorMessage}
          retryLabel={words.tryAgain}
        />
      );
  }
}
