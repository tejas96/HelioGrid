import { type ReactNode, type RefObject, useRef } from 'react';
import { ShellGlyph } from '../AppShell';
import { Banner, BannerAction, BannerStack } from '../Banner';
import { Derivation } from '../Derivation';
import { FactRow, FactRows } from '../FactRow';
import { LoadingBars } from '../LoadingBars';
import { ScopeNote } from '../ScopeNote';
import type {
  BillingStripMark,
  BillingStripProps,
  BillingStripSlotProps,
  BillingStripView,
} from './BillingStrip.types';
import { BillingValueText } from './BillingValue';

/** Each row's mark: the word beside it carries the fact, the mark only repeats it (decision 2). */
const MARK: Record<BillingStripMark, ReactNode> = {
  paused: <ShellGlyph name="pause" size="sm" tone="warning" />,
  works: <ShellGlyph name="tick" size="sm" tone="success" />,
  until: <ShellGlyph name="clock" size="sm" tone="secondary" />,
  amount: <ShellGlyph name="rupee" size="sm" tone="secondary" />,
};

type Frame = RefObject<HTMLDivElement | null>;

/**
 * The shell's slot (`SCR-SHELL-06`). The frame stays while the read swaps what it holds, so
 * `Try again` hands focus to it.
 */
export function BillingStripSlot({ read, words, ...acts }: BillingStripSlotProps) {
  const frame = useRef<HTMLDivElement>(null);
  return (
    <div className="hg-billing-strip-slot">
      <div ref={frame} tabIndex={-1} className="hg-billing-strip-measure hg-focus-target">
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
      </div>
    </div>
  );
}

/** `SCR-SHELL-06`'s strip: the trial's chip, or the title, its rows, the working and one act. */
export function BillingStrip({ strip, words, onAct, acting, failure }: BillingStripProps) {
  const frame = useRef<HTMLDivElement>(null);
  return (
    <div ref={frame} tabIndex={-1} className="hg-billing-strip hg-focus-target">
      {strip.variant === 'pill' ? (
        <div className="hg-billing-strip-pill">
          <Banner variant="pill" kind={strip.kind} title={strip.title} />
        </div>
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
      {failure === null || failure === undefined ? null : (
        <span role="alert" className="hg-billing-strip-failure">
          {failure}
        </span>
      )}
    </div>
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
      <BillingValueText value={strip.act.label} />
    </BannerAction>
  );
}

function StripBody({ strip, words }: Pick<BillingStripProps, 'strip' | 'words'>) {
  return (
    <>
      {strip.rows.length === 0 ? null : (
        <div className="hg-billing-strip-rows">
          <FactRows label={strip.title} density="expressive" form="lead">
            {strip.rows.map((row) => (
              <FactRow
                key={row.key}
                mark={MARK[row.mark]}
                label={row.label}
                value={<BillingValueText value={row.value} />}
              />
            ))}
          </FactRows>
        </div>
      )}
      {strip.working === null ? null : (
        <Derivation
          summary={words.howWorkedOut}
          label={strip.working.label}
          kindWords={words.derivationKinds}
          parts={strip.working.parts.map((part) => ({
            kind: part.kind,
            label: part.label,
            text: <BillingValueText value={part.value} />,
          }))}
        />
      )}
    </>
  );
}
