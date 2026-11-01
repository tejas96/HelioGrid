import type { TranslatedText } from '@heliogrid/contracts';
import { ShellGlyph } from '../AppShell';
import { Banner, BannerStack } from '../Banner';
import { Block } from '../Block';
import { Button } from '../Button';
import { Derivation } from '../Derivation';
import { FactRow, FactRows } from '../FactRow';
import { ListRow } from '../ListRow';
import { ScopeNote } from '../ScopeNote';
import { StatusChip } from '../StatusChip';
import type {
  BillingBodyActing,
  BillingChip,
  BillingHomeWords,
  BillingNeedsView,
  BillingStripView,
  BillingWorkingPart,
} from './BillingHome.types';
import { BillingValueText } from './BillingValue';

/** Each strip row's mark — the word beside it carries the fact, the mark only repeats it. */
const STRIP_MARK = {
  paused: <ShellGlyph name="pause" size="sm" tone="warning" />,
  works: <ShellGlyph name="tick" size="sm" tone="success" />,
  until: <ShellGlyph name="clock" size="sm" tone="secondary" />,
} as const;

/** `SCR-SHELL-06`'s strip as this page draws it: no act and no amount row (frames 7a, 8, 10, 11, 13). */
export function BillingStrip({
  strip,
  moreLabel,
}: {
  strip: BillingStripView;
  moreLabel: (hidden: number) => TranslatedText;
}) {
  return (
    <BannerStack mode="single" moreLabel={moreLabel}>
      <Banner kind={strip.kind} title={strip.title}>
        <div className="hg-billing-strip-rows">
          <FactRows label={strip.title} density="expressive" form="lead">
            {strip.rows.map((row) => (
              <FactRow
                key={row.key}
                mark={STRIP_MARK[row.mark]}
                label={row.label}
                value={<BillingValueText value={row.value} />}
              />
            ))}
          </FactRows>
        </div>
      </Banner>
    </BannerStack>
  );
}

export function BillingChipMark({ chip }: { chip: BillingChip }) {
  return <StatusChip label={chip.word} tone={chip.tone} density="expressive" />;
}

/** `How it is worked out`: each part's figures in mono where the sentence put them. */
export function BillingWorking({
  working,
  words,
  defaultOpen,
}: {
  working: { readonly label: TranslatedText; readonly parts: readonly BillingWorkingPart[] };
  words: BillingHomeWords;
  defaultOpen?: boolean;
}) {
  return (
    <Derivation
      summary={words.howWorkedOut}
      label={working.label}
      kindWords={words.derivationKinds}
      defaultOpen={defaultOpen}
      parts={working.parts.map((part) => ({
        kind: part.kind,
        label: part.label,
        text: <BillingValueText value={part.value} />,
      }))}
    />
  );
}

/**
 * `Needs you` / `The way back` / `Needs the owner` (decisions 1, 2, 14): `SCR-M12-04`'s rows, the
 * data kept in the strip's row form, the amount's working, then the ONE act — or, for a person who
 * is not the Owner, whose act it is.
 */
export function BillingNeeds({
  needs,
  words,
  pending,
  failure,
  onAct,
}: {
  needs: BillingNeedsView;
  words: BillingHomeWords;
  pending: BillingBodyActing;
  /** Why the act did not land, said under it. */
  failure: TranslatedText | null;
  onAct: () => void;
}) {
  return (
    <Block
      title={needs.title}
      density="expressive"
      badge={needs.badge === null ? undefined : <BillingChipMark chip={needs.badge} />}
    >
      <div className="hg-billing-stack" data-gap="4">
        {needs.rows.map((row) => (
          <ListRow
            key={row.key}
            className="hg-billing-need-row"
            density="expressive"
            title={row.title}
            marks={row.chip === null ? undefined : <BillingChipMark chip={row.chip} />}
            trailing={
              row.figure === null ? undefined : (
                <span className="hg-billing-figure">
                  <BillingValueText value={row.figure} />
                </span>
              )
            }
            subtitle={
              row.line === null ? undefined : (
                <span className="hg-billing-need-line" data-tone={row.chip?.tone ?? 'warning'}>
                  {row.line}
                </span>
              )
            }
          />
        ))}
        {needs.dataKept === null ? null : (
          <FactRows label={needs.dataKept.label} density="expressive" form="lead">
            <FactRow
              mark={<ShellGlyph name="shield" size="sm" tone="success" />}
              label={needs.dataKept.label}
              value={needs.dataKept.value}
            />
          </FactRows>
        )}
        {needs.working === null ? null : <BillingWorking working={needs.working} words={words} />}
        {needs.act === null ? null : (
          <div className="hg-billing-act">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={pending === 'need'}
              disabled={pending !== null}
              onClick={onAct}
            >
              {needs.act.label}
            </Button>
            {needs.act.line === null ? null : (
              <span className="hg-billing-act-line">{needs.act.line}</span>
            )}
            {failure === null ? null : (
              <span role="alert" className="hg-billing-failure hg-billing-act-line">
                {failure}
              </span>
            )}
          </div>
        )}
        {needs.scope === null ? null : (
          <ScopeNote title={needs.scope.title} variant="line" size={13} />
        )}
      </div>
    </Block>
  );
}
