import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { type ReactNode, type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { BannerAction } from '../Banner/BannerAction.native';
import { BannerStack } from '../Banner/BannerStack.native';
import { Derivation } from '../Derivation/Derivation.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { ScopeNote } from '../ScopeNote/ScopeNote.native';
import type {
  BillingStripMark,
  BillingStripProps,
  BillingStripSlotProps,
  BillingStripView,
} from './BillingStrip.types';
import { BillingValueText, valueRuns, workingParts } from './BillingValue.native';

/** Each row's mark: the word beside it carries the fact, the mark only repeats it (decision 2). */
const MARK: Record<BillingStripMark, ReactNode> = {
  paused: <ShellGlyph name="pause" size="sm" tone="warning" />,
  works: <ShellGlyph name="tick" size="sm" tone="success" />,
  until: <ShellGlyph name="clock" size="sm" tone="secondary" />,
  amount: <ShellGlyph name="rupee" size="sm" tone="secondary" />,
};

type Frame = RefObject<View | null>;

/**
 * The shell's slot (`SCR-SHELL-06`), pinned above the scrolling content. The frame stays while the
 * read swaps what it holds, so `Try again` hands the screen reader to it.
 */
export function BillingStripSlot({ read, words, ...acts }: BillingStripSlotProps) {
  const frame = useRef<View>(null);
  return (
    <View ref={frame} style={styles.slot}>
      {read.kind === 'loading' ? (
        <LoadingBars label={words.loading} bars={['panel']} />
      ) : read.kind === 'failed' ? (
        <BannerStack mode="single" moreLabel={words.moreLabel}>
          <Banner
            kind="state"
            tone="neutral"
            title={words.failedTitle}
            action={
              <BannerAction onClick={read.retry} focusAfter={frame}>
                {words.tryAgain}
              </BannerAction>
            }
          />
        </BannerStack>
      ) : (
        <BillingStrip strip={read.value} words={words} {...acts} />
      )}
    </View>
  );
}

/**
 * `SCR-SHELL-06`'s strip: the trial's chip, or the title, its rows, the working and one act — the
 * act on its own line under the rows at 375 (`Banner`'s `actionBelow`).
 */
export function BillingStrip({ strip, words, onAct, acting, failure }: BillingStripProps) {
  const frame = useRef<View>(null);
  return (
    <View ref={frame}>
      {strip.variant === 'pill' ? (
        <View style={styles.pill}>
          <Banner variant="pill" kind={strip.kind} title={strip.title} />
        </View>
      ) : (
        <BannerStack mode="single" moreLabel={words.moreLabel}>
          <Banner
            kind={strip.kind}
            title={strip.title}
            action={actionOf(strip, onAct, acting, frame)}
          >
            <StripBody strip={strip} words={words} />
          </Banner>
        </BannerStack>
      )}
      {failure === null || failure === undefined ? null : <Failure line={failure} />}
    </View>
  );
}

function Failure({ line }: { line: TranslatedText }) {
  return (
    <Text variant="caption" color="danger" live style={styles.failure}>
      {line}
    </Text>
  );
}

function actionOf(
  strip: BillingStripView,
  onAct: (() => void) | undefined,
  acting: boolean | undefined,
  frame: Frame,
): ReactNode {
  if (strip.scope !== null) return <ScopeNote title={strip.scope} variant="line" size={13} />;
  if (strip.act === null || onAct === undefined) return undefined;
  return (
    <BannerAction onClick={acting === true ? undefined : onAct} focusAfter={frame}>
      {valueRuns(strip.act.label)}
    </BannerAction>
  );
}

function StripBody({ strip, words }: Pick<BillingStripProps, 'strip' | 'words'>) {
  return (
    <>
      {strip.rows.length === 0 ? null : (
        <View style={styles.rows}>
          <FactRows label={strip.title} density="expressive" form="lead">
            {strip.rows.map((row) => (
              <FactRow
                key={row.key}
                mark={MARK[row.mark]}
                label={row.label}
                value={<BillingValueText value={row.value} align="start" />}
              />
            ))}
          </FactRows>
        </View>
      )}
      {strip.working === null ? null : (
        <Derivation
          summary={words.howWorkedOut}
          label={strip.working.label}
          kindWords={words.derivationKinds}
          parts={workingParts(strip.working.parts)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  /* The slot under the bar: the page's side padding, `sp-3` above and below. */
  slot: {
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingVertical: theme.spacing['sp-3'],
  },
  rows: { marginTop: theme.spacing['sp-2'] },
  pill: { flexDirection: 'row', alignItems: 'center' },
  failure: { marginTop: theme.spacing['sp-2'] },
});
