import type { CSSProperties } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text';
import { stageSharesOf } from './StageMeter.logic';
import type { StageMeterProps } from './StageMeter.types';

type ShareVars = CSSProperties & { '--hg-stage-meter-share': string };

const shareOf = (share: number): ShareVars => ({ '--hg-stage-meter-share': `${share}` });

/**
 * The pipeline by stage: on the phone's card the one bar over the stages, on the desktop's band
 * each stage over its own share of it. Each count is a button that filters to its stage.
 */
export function StageMeter({ stages, chosen, onPick, form, words }: StageMeterProps) {
  const shares = stageSharesOf(stages);
  return (
    <section className="hg-stage-meter" data-form={form} aria-label={words.heading}>
      {form === 'card' ? (
        <>
          <div className="hg-stage-meter-head">
            <Text variant="overline" color="secondary">
              {words.heading}
            </Text>
            <Text variant="caption" color="secondary">
              {words.hint}
            </Text>
          </div>
          <div className="hg-stage-meter-bar" aria-hidden="true">
            {stages.map((one, index) => (
              <span
                key={one.stage}
                className="hg-stage-meter-share"
                style={shareOf(shares[index] ?? 0)}
              />
            ))}
          </div>
        </>
      ) : null}
      <div className="hg-stage-meter-stages">
        {stages.map((one, index) => (
          <Pressable
            key={one.stage}
            className="hg-stage-meter-stage"
            style={form === 'band' ? shareOf(shares[index] ?? 0) : undefined}
            accessibilityLabel={words.spoken(one.stage, one.count)}
            accessibilityState={{ selected: chosen === one.stage }}
            onPress={() => onPick(one.stage)}
          >
            {form === 'band' ? <span className="hg-stage-meter-share" aria-hidden="true" /> : null}
            <span className="hg-stage-meter-count" aria-hidden="true">
              {one.count}
            </span>
            <span className="hg-stage-meter-word" aria-hidden="true">
              {words.stage(one.stage)}
            </span>
          </Pressable>
        ))}
      </div>
    </section>
  );
}
