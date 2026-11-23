'use client';
import type { PlanShown, StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { IconButton, Pressable, ShellGlyph } from '@heliogrid/ui';

/**
 * The plan's row in the picture menu (`T-M05-002d`, board 4.7, 4.8): its name — a tap picks it — its
 * eye and its lock, so a hidden plan is never lost; for a PDF of many pages, the page laid with ‹ ›, and one line on
 * what to do when we picked the wrong one.
 */
export function StudioPlanRow({
  plan,
  studio,
  words,
}: {
  plan: PlanShown | null;
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  if (plan === null) return null;
  const { ownMoves } = studio;
  const { hidden, locked, page } = plan.laid;
  const editable = studio.editing.kind === 'editor';
  return (
    <div className="hg-studio-plan-row">
      <ShellGlyph name="layers" size="md" />
      <span className="hg-studio-picker-words">
        {/* The way back to a plan put down under a roof: a tap picks it, with its card and handles. */}
        <Pressable
          className="hg-studio-plan-pick"
          accessibilityLabel={words.movePlan}
          disabled={!editable || locked || hidden}
          onPress={() => {
            studio.moves.showPictures(false);
            ownMoves.pickPlan(true);
          }}
        >
          <span className="hg-studio-picker-title">{words.planTitle}</span>
          <span className="hg-studio-picker-line">{plan.name}</span>
        </Pressable>
        {plan.pages > 1 ? (
          <span className="hg-studio-plan-page">
            <IconButton
              label={words.pageBefore}
              variant="ghost"
              disabled={!editable}
              onClick={() => ownMoves.pagePlan(-1)}
            >
              <ShellGlyph name="chevron-left" size="sm" />
            </IconButton>
            <span className="hg-studio-picker-line">{words.planPage(page, plan.pages)}</span>
            <IconButton
              label={words.pageAfter}
              variant="ghost"
              disabled={!editable}
              onClick={() => ownMoves.pagePlan(1)}
            >
              <ShellGlyph name="chevron-right" size="sm" />
            </IconButton>
          </span>
        ) : null}
        {plan.pages > 1 ? <span className="hg-studio-picker-line">{words.wrongPage}</span> : null}
      </span>
      <IconButton
        label={words.hidePlan(hidden)}
        variant="ghost"
        pressed={hidden}
        disabled={!editable}
        onClick={() => ownMoves.hidePlan(!hidden)}
      >
        <ShellGlyph name={hidden ? 'eye-off' : 'eye'} size="md" />
      </IconButton>
      <IconButton
        label={words.lockPlan(locked)}
        variant="ghost"
        pressed={locked}
        disabled={!editable}
        onClick={() => ownMoves.lockPlan(!locked)}
      >
        <ShellGlyph name="lock" size="md" />
      </IconButton>
    </div>
  );
}
