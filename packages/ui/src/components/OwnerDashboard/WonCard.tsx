import type { RefObject } from 'react';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { IconButton } from '../IconButton';
import { useFormat } from '../MarketProvider';
import { NamedGap } from '../NamedGap';
import { ProgressBar } from '../ProgressBar';
import { ProvenanceTier } from '../Provenance';
import { RollingNumber } from '../RollingNumber';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import { percentOf, targetShareOf } from './OwnerDashboard.logic';
import type { OwnerDashboardWords } from './OwnerDashboard.types';
import { TargetEditor } from './TargetEditor';
import type { TargetEditing } from './target-draft';

/**
 * Won so far this month (`M13-17`), derived from the projects Mark won started, against the
 * company's target when one is set. A reader who may set it sets or edits it in place; with no
 * target and no right to set one, the card says nothing about a target at all — never a nag.
 */
export function WonCard(
  props: DashboardPartProps & {
    readonly target: TargetEditing;
    readonly figure: RefObject<HTMLDivElement | null>;
  },
) {
  const { view, words } = props;
  const format = useFormat();
  const { target, figure } = props;
  const share = targetShareOf(view);
  const editable = view.canSetTarget && !target.editing;
  return (
    <Card className="hg-owner-card">
      <section className="hg-owner-card-body" aria-label={words.wonSoFar}>
        <div className="hg-owner-card-head">
          <Text as="h2" variant="h3">
            {words.wonSoFar}
          </Text>
          <ProvenanceTier tier="derived" />
          {editable && view.target !== null ? (
            <span className="hg-owner-card-corner">
              <IconButton label={words.editTarget} onClick={target.open}>
                <ShellGlyph name="pencil" size="sm" tone="primary" />
              </IconButton>
            </span>
          ) : null}
        </div>
        <div ref={figure} tabIndex={-1} className="hg-owner-figure-block hg-focus-target">
          <span className="hg-owner-tile-figure">
            <RollingNumber value={format.money(view.won.thisMonth.amount)} variant="figure" />
          </span>
          <Text variant="body-sm" color="secondary">
            {words.wonDeals(view.won.thisMonth.count)}
          </Text>
        </div>
        {target.editing ? (
          <TargetEditor
            words={words}
            initial={view.target?.amount ?? null}
            saving={props.targetSaving}
            failed={props.targetFailed}
            onSave={props.onSetTarget}
            onCancel={target.close}
            focusAfter={figure}
          />
        ) : view.target !== null && share !== null ? (
          <div className="hg-owner-target">
            <span aria-hidden="true">
              <ProgressBar value={share * 100} />
            </span>
            <Text variant="body-sm" color="secondary">
              {words.ofTarget(percentOf(share, words, format), format.money(view.target.amount))}
            </Text>
          </div>
        ) : editable ? (
          <span className="hg-owner-target-set">
            <Button variant="ghost" size="md" onClick={target.open}>
              {words.setTarget}
            </Button>
          </span>
        ) : null}
      </section>
    </Card>
  );
}

/**
 * The forecast's honest gap (`M13-14`): no number until proposals price the pipeline, and then
 * expected, never promised — so the tile is a dashed outline, not a figure.
 */
export function ForecastTile({ words }: { words: OwnerDashboardWords }) {
  return (
    <section className="hg-owner-forecast" aria-label={words.forecastTitle}>
      <Text as="h2" variant="overline" color="secondary">
        {words.forecastTitle}
      </Text>
      <NamedGap gap={words.forecastGap} scale="headline" />
      <Text variant="caption" color="secondary">
        {words.forecastNote}
      </Text>
    </section>
  );
}
