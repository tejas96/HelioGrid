import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { BillingValueText, workingParts } from '../BillingStrip/BillingValue.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { Derivation } from '../Derivation/Derivation.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { MoneySummary } from '../MoneySummary/MoneySummary.native';
import { Provenance } from '../Provenance/Provenance.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import { moneyOf } from './PlanReview.logic';
import type { PlanReviewProps, PlanReviewRow, PlanReviewSection } from './PlanSelection.types';
import type { PlanSelectionWords } from './PlanSelection.words';

/**
 * The review on the phone (decision 6): the sheet that rises from the act, the consent surface
 * (`M12-49`). While the act's answer is out its button shows `loading` and nothing else acts.
 */
export function PlanReview({ open, view, words, acting, onClose, onConfirm }: PlanReviewProps) {
  const act = view?.act ?? null;
  return (
    <EditorSurface
      open={open && view !== null}
      onClose={() => {
        if (!acting) onClose();
      }}
      closeLabel={words.close}
      showClose
      dismissible={!acting}
      desktop="panel"
      size="auto"
      density="expressive"
      title={words.review}
      {...(view === null ? {} : { subtitle: view.subtitle })}
      {...(act === null
        ? {}
        : {
            footer: (
              <View style={styles.foot}>
                <SheetActions>
                  <Button fullWidth loading={acting} disabled={acting} onClick={onConfirm}>
                    {act.label}
                  </Button>
                </SheetActions>
                {act.line === null ? null : (
                  <Text variant="caption" color="secondary" align="center">
                    {act.line}
                  </Text>
                )}
              </View>
            ),
          })}
    >
      {view === null ? null : (
        <View style={styles.body}>
          {view.changed === null ? null : <Banner kind="state" title={view.changed} />}
          {view.failure === null ? null : (
            <Banner kind="state" tone="danger" title={view.failure} />
          )}
          {view.sections.map((section) => (
            <Section key={section.key} section={section} words={words} />
          ))}
        </View>
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
          value={<BillingValueText value={row.value} align={row.amount ? 'end' : 'start'} />}
          {...(row.mark === null ? {} : { provenance: { note: row.mark, size: 12 } })}
        />
      ))}
    </FactRows>
  );
}

function Section({ section, words }: { section: PlanReviewSection; words: PlanSelectionWords }) {
  switch (section.kind) {
    case 'facts':
      return (
        <View style={styles.group}>
          {section.overline === null ? null : (
            <Text variant="overline" color="tertiary">
              {section.overline}
            </Text>
          )}
          <Rows label={section.label} rows={section.rows} />
          {section.source === null ? null : <Provenance source={section.source} size={12} />}
        </View>
      );
    case 'blocked':
      return (
        <Banner kind="cap" title={section.title}>
          <Rows label={section.title} rows={section.rows} />
        </Banner>
      );
    case 'money':
      return (
        <View style={styles.group}>
          <MoneySummary
            equation={moneyOf(section)}
            words={words.moneySummary}
            overline={words.whatYouPayToday}
            payableLabel={words.totalToday}
            surface="screen"
            density="expressive"
            {...(section.source === null
              ? {}
              : { provenance: { tier: 'unmarked', source: section.source } })}
          />
          {section.working === null ? null : (
            <Derivation
              summary={words.howWorkedOut}
              label={section.working.label}
              parts={workingParts(section.working.parts)}
              kindWords={words.derivationKinds}
            />
          )}
        </View>
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

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-5'] },
  group: { gap: theme.spacing['sp-2'] },
  foot: { gap: theme.spacing['sp-2'] },
});
