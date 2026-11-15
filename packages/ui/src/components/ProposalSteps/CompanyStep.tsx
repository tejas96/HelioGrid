import { Pressable } from '../../primitives/Pressable/Pressable';
import { rovingTargetOf } from '../../primitives/press-keys';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { ProposalPicture } from '../ProposalPicture/ProposalPicture';
import type { CompanyStepView } from './ProposalSteps.types';
import { StepFacts, StepHint } from './StepParts';
import { proposalTypeChoice } from './step-fields';

function CoverStrip({ view }: { view: CompanyStepView }) {
  const { covers, cover, words } = view;
  const chosen = covers.find((choice) => choice.key === cover);
  const keys = covers.map((choice) => choice.key);
  return (
    <div className="hg-pst-field">
      <span className="hg-pst-field-top">
        <span className="hg-pst-field-label">{words.cover}</span>
        {chosen === undefined ? null : <span className="hg-pst-field-tag">{chosen.name}</span>}
      </span>
      <div className="hg-pst-covers" role="radiogroup" aria-label={words.cover}>
        {covers.map((choice) => {
          const on = choice.key === cover;
          return (
            <Pressable
              key={choice.key}
              className="hg-pst-cover"
              accessibilityRole="radio"
              accessibilityLabel={choice.name}
              accessibilityState={{ checked: on }}
              focusGroup={{
                tabbable: on || (chosen === undefined && choice.key === keys[0]),
                onKey: (key) => {
                  const target = rovingTargetOf(key, keys.indexOf(choice.key), keys.length, 'row');
                  const next = target === null ? undefined : keys[target];
                  if (next === undefined) return false;
                  view.onCover(next);
                  return true;
                },
              }}
              onPress={() => view.onCover(choice.key)}
            >
              <span className="hg-pst-cover-in" data-on={on ? '' : undefined}>
                <ProposalPicture name={choice.picture} src={choice.src} />
                {on ? (
                  <span className="hg-pst-check" data-on="">
                    <ShellGlyph name="tick-small" size="sm" tone="inverse" />
                  </span>
                ) : null}
              </span>
            </Pressable>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Step 1 (`M06-06`, `M06-07`, `T-M06-003`): who owns the system, the cover picture for this
 * proposal, and the company's facts — read-only here, with one line naming who can change them.
 */
export function CompanyStep({ view, wide }: { view: CompanyStepView; wide: boolean }) {
  const { words, peek } = view;
  const choice = proposalTypeChoice(view);
  return (
    <>
      {wide || peek === undefined || peek.page === null ? null : (
        <Pressable
          className="hg-pst-peek"
          accessibilityLabel={words.openPeek}
          onPress={peek.onOpen}
        >
          <span className="hg-pst-peek-in">
            {peek.page}
            <span className="hg-pst-peek-tag">
              <ShellGlyph name="eye" size="sm" />
              {words.peek}
            </span>
          </span>
        </Pressable>
      )}
      <div className="hg-pst-controls">
        <OptionCardGroup
          {...choice.group}
          options={choice.options.map(({ glyph, ...option }) => ({
            ...option,
            icon: <ShellGlyph name={glyph} size="md" />,
          }))}
        />
        <CoverStrip view={view} />
        <StepFacts facts={view.facts} />
        <StepHint glyph="lock">{words.factsLine}</StepHint>
      </div>
    </>
  );
}
